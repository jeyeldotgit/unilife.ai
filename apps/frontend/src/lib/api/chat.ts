import { getAssignments } from "@/lib/api/assignments";
import { getBudgetChatContext } from "@/lib/api/budget";
import { requestBackend } from "@/lib/api/client";
import { getChatUpcomingDeadlines } from "@/lib/api/deadlines";
import { getExams } from "@/lib/api/exams";
import { listExpenseRecords } from "@/lib/api/finance-data";
import { getClasses } from "@/lib/api/schedule";
import {
  inferExpenseCategory,
  formatTimeLabel,
  titleCase,
} from "@/lib/api/utils";
import type {
  AiProposal,
  AllowanceForecast,
  FreeTimePlan,
  PlanningContext,
} from "@unilife-ai/types";
import type {
  ChatAllowanceForecastMessage,
  ChatClientEffect,
  ChatFreeTimeRecommendationMessage,
  ChatQuickAction,
  ChatSendResult,
  ChatState,
  ChatTextMessage,
  ExpenseCategory,
  SendChatMessageInput,
} from "@/lib/types";

type AiChatIntent =
  | "create_assignment"
  | "update_assignment"
  | "delete_assignment"
  | "create_class"
  | "create_exam"
  | "update_class"
  | "delete_class"
  | "create_exam"
  | "update_exam"
  | "delete_exam"
  | "log_expense"
  | "delete_expense"
  | "query_schedule"
  | "query_deadlines"
  | "query_budget"
  | "free_time_finder"
  | "allowance_forecast"
  | "general_question"
  | "unknown";

type AiChatResponse = {
  intent: AiChatIntent;
  action: Record<string, unknown> | null;
  message: string;
  forecast?: AllowanceForecast;
  free_time?: FreeTimePlan;
  requires_confirmation: boolean;
  proposal: AiProposal | null;
};

const quickActions: ChatQuickAction[] = [
  {
    id: "quick-task",
    label: "+ Task",
    icon: "assignment_add",
    prompt: "assignment book report next friday 11:59pm",
    kind: "create_assignment",
  },
  {
    id: "quick-expense",
    label: "+ Expense",
    icon: "payments",
    prompt: "lunch 85",
    kind: "log_expense",
  },
  {
    id: "quick-class",
    label: "+ Class",
    icon: "calendar_add_on",
    prompt: "add class Physics monday 8am to 10am",
    kind: "create_class",
  },
  {
    id: "quick-exam",
    label: "+ Exam",
    icon: "quiz",
    prompt: "add exam",
    kind: "create_exam",
  },
  {
    id: "quick-due",
    label: "What's due?",
    icon: "event_upcoming",
    prompt: "what's due?",
    kind: "ask_due",
  },
  {
    id: "quick-free-time",
    label: "What next?",
    icon: "bolt",
    prompt: "what should I do right now?",
    kind: "free_time",
  },
];

function getCurrentTimeString() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(
    now.getMinutes(),
  ).padStart(2, "0")}`;
}

function buildUserMessage(input: SendChatMessageInput) {
  const createdAt = input.createdAt ?? new Date().toISOString();

  return {
    id: crypto.randomUUID(),
    role: "user",
    kind: "text",
    text: input.text.trim(),
    createdAt,
    timeLabel: formatTimeLabel(createdAt),
  } satisfies ChatTextMessage;
}

function buildTextMessage(text: string) {
  return {
    id: crypto.randomUUID(),
    role: "ai",
    kind: "text",
    text,
    createdAt: new Date().toISOString(),
  } satisfies ChatTextMessage;
}

function buildProposalMessage(proposal: AiProposal) {
  return {
    id: crypto.randomUUID(),
    role: "ai",
    kind: "proposal_review",
    payload: proposal,
    createdAt: new Date().toISOString(),
  } as const;
}

function buildFreeTimeRecommendation(
  response: AiChatResponse,
): ChatFreeTimeRecommendationMessage | null {
  if (!response.free_time) {
    return null;
  }

  return {
    id: crypto.randomUUID(),
    role: "ai",
    kind: "free_time_recommendation",
    createdAt: new Date().toISOString(),
    payload: {
      freeWindowLabel:
        response.free_time.current_class_subject
          ? `You are currently in ${response.free_time.current_class_subject}`
          : response.free_time.window_minutes < 60
            ? `You have ${response.free_time.window_minutes} minutes free`
            : `You have ${Math.floor(response.free_time.window_minutes / 60)}h ${
                response.free_time.window_minutes % 60
              }m free`,
      nextClassLabel: response.free_time.next_class_subject
        ? `${response.free_time.next_class_subject} starts at ${response.free_time.next_class_time}`
        : "No more classes are scheduled after this window.",
      recommendations: response.free_time.suggested_tasks.map((task) => ({
        entityId: task.id ?? null,
        kind: task.type,
        title: task.title,
        dueLabel:
          task.urgency_days <= 1
            ? "Due within 1 day"
            : `Due in ${task.urgency_days} days`,
        subjectLabel: task.subject ?? "No class",
        typeLabel: task.type === "exam" ? "Exam" : "Assignment",
        priorityLabel:
          task.urgency_days <= 2
            ? "High priority"
            : task.urgency_days <= 5
              ? "Medium priority"
              : "Low priority",
        icon: task.type === "exam" ? "quiz" : "assignment",
      })),
      closingText: response.message,
    },
  };
}

function buildAllowanceForecastMessage(
  response: AiChatResponse,
): ChatAllowanceForecastMessage | null {
  if (!response.forecast) return null;

  return {
    id: crypto.randomUUID(),
    role: "ai",
    kind: "allowance_forecast",
    createdAt: new Date().toISOString(),
    payload: {
      ...response.forecast,
      closingText: response.message,
    },
  };
}

function normalizeExpenseLabelFromMessage(text: string) {
  const match = text.trim().match(/^(.+?)\s+(\d+(?:\.\d{1,2})?)$/);

  if (!match) {
    return null;
  }

  return titleCase(match[1].trim());
}

function getAssignmentAction(action: Record<string, unknown> | null) {
  if (
    !action ||
    typeof action.title !== "string" ||
    typeof action.due_date !== "string"
  ) {
    return null;
  }

  return {
    title: action.title,
    dueAt: action.due_date,
    classId:
      typeof action.class_id === "string" || action.class_id === null
        ? action.class_id
        : null,
  };
}

function getExpenseAction(action: Record<string, unknown> | null) {
  let category: ExpenseCategory | undefined;

  if (
    action?.category === "food" ||
    action?.category === "transportation" ||
    action?.category === "school" ||
    action?.category === "entertainment" ||
    action?.category === "miscellaneous"
  ) {
    category = action.category;
  }

  if (!action || typeof action.amount !== "number") {
    return null;
  }

  return {
    amount: action.amount,
    category,
  };
}

function normalizeExpenseLabel(inputText: string, action: { category?: ExpenseCategory }) {
  const normalizedFromMessage = normalizeExpenseLabelFromMessage(inputText);

  if (normalizedFromMessage) {
    return normalizedFromMessage;
  }

  const trimmedInput = inputText.trim();
  const withoutTrailingAmount = trimmedInput.replace(/\s+\d+(?:\.\d{1,2})?\s*$/, "");
  const semanticLabel = withoutTrailingAmount.trim() || trimmedInput;

  if (semanticLabel) {
    return titleCase(semanticLabel);
  }

  return action.category ? `${titleCase(action.category)} expense` : "Expense";
}

function getExpenseCategory(
  inputText: string,
  action: { category?: ExpenseCategory },
  label: string,
) {
  if (action.category) {
    return action.category;
  }

  const inferredFromInput = inferExpenseCategory(inputText);

  if (inferredFromInput !== "miscellaneous") {
    return inferredFromInput;
  }

  const inferredFromLabel = inferExpenseCategory(label);

  if (inferredFromLabel !== "miscellaneous") {
    return inferredFromLabel;
  }

  return "miscellaneous" as const;
}

function getClarifyingMessage(response: AiChatResponse) {
  if (!response.requires_confirmation) {
    return null;
  }

  if (response.intent === "create_class") {
    return "I can add that class once I have the subject, day, start time, and end time.";
  }

  if (response.intent === "create_exam") {
    return "I can add that exam once I have the title and exact exam date and time.";
  }

  if (response.intent === "log_expense") {
    return "I can log that expense once I have the amount and what it was for.";
  }

  return null;
}

export function getClientEffect(
  inputText: string,
  response: AiChatResponse,
): ChatClientEffect | undefined {
  if (
    response.intent === "create_assignment" &&
    !response.requires_confirmation
  ) {
    const action = getAssignmentAction(response.action);

    if (action) {
      return {
        kind: "create_assignment",
        payload: {
          classId: action.classId,
          dueAt: action.dueAt,
          title: action.title,
        },
      };
    }
  }

  if (response.intent === "log_expense" && !response.requires_confirmation) {
    const action = getExpenseAction(response.action);

    if (action) {
      const label = normalizeExpenseLabel(inputText, action);

      return {
        kind: "log_expense",
        payload: {
          amount: action.amount,
          category: getExpenseCategory(inputText, action, label),
          label,
        },
      };
    }
  }

  return undefined;
}

export async function getChatState(): Promise<ChatState> {
  return {
    messages: [],
    quickActions,
  };
}

export async function sendMessage(
  input: SendChatMessageInput,
): Promise<ChatSendResult> {
  const userMessage = buildUserMessage(input);
  const [scheduleWeek, assignments, exams, budgetContext, expenses] = await Promise.all([
    getClasses(),
    getAssignments(),
    getExams(),
    getBudgetChatContext(),
    listExpenseRecords(),
  ]);

  const context = {
    today: new Date().toISOString().slice(0, 10),
    current_time: getCurrentTimeString(),
    todays_classes: scheduleWeek.todayClasses.map((classItem) => ({
      subject: classItem.subject,
      start_time: classItem.startTime,
      end_time: classItem.endTime,
    })),
    upcoming_deadlines: getChatUpcomingDeadlines(assignments, exams),
    budget_remaining: budgetContext.budgetRemaining,
    budget_period_end_date: budgetContext.budgetPeriodEndDate,
    avg_daily_spend: budgetContext.avgDailySpend,
    entities: [
      ...(scheduleWeek.classes ?? []).map((item) => ({
        id: item.logicalId ?? item.id,
        entity_type: "class" as const,
        label: item.subject,
      })),
      ...assignments.map((item) => ({
        id: item.id,
        entity_type: "assignment" as const,
        label: item.title,
      })),
      ...exams.map((item) => ({
        id: item.id,
        entity_type: "exam" as const,
        label: item.title,
      })),
      ...expenses.map((item) => ({
        id: item.id,
        entity_type: "expense" as const,
        label: item.description ?? item.category,
      })),
    ],
  } satisfies PlanningContext & {
    entities: Array<{
      id: string;
      entity_type: "class" | "assignment" | "exam" | "expense";
      label: string;
    }>;
  };
  const response = await requestBackend<AiChatResponse>("/api/ai/chat", {
    method: "POST",
    body: {
      message: input.text.trim(),
      context,
    },
  });

  if (response.intent === "free_time_finder") {
    const recommendation = buildFreeTimeRecommendation(response);

    if (recommendation) {
      return {
        userMessage,
        responseMessage: recommendation,
      };
    }
  }

  if (response.intent === "allowance_forecast") {
    const forecast = buildAllowanceForecastMessage(response);
    if (forecast) {
      return { userMessage, responseMessage: forecast };
    }
  }

  const clientEffect = getClientEffect(input.text, response);
  if (clientEffect) {
    return {
      clientEffect,
      userMessage,
      responseMessage: buildTextMessage(response.message),
    };
  }

  if (response.proposal) {
    return {
      userMessage,
      responseMessage: buildProposalMessage(response.proposal),
    };
  }

  return {
    userMessage,
    responseMessage: buildTextMessage(
      getClarifyingMessage(response) ?? response.message,
    ),
  };
}

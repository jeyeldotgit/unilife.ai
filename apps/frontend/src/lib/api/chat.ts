import { getAssignments } from "@/lib/api/assignments";
import { getBudgetChatContext } from "@/lib/api/budget";
import { requestBackend } from "@/lib/api/client";
import { getChatUpcomingDeadlines } from "@/lib/api/deadlines";
import { getExams } from "@/lib/api/exams";
import { getClasses } from "@/lib/api/schedule";
import {
  inferExpenseCategory,
  formatTimeLabel,
  getDayIndex as getScheduleDayIndex,
  titleCase,
} from "@/lib/api/utils";
import type {
  ChatClientEffect,
  ChatFreeTimeRecommendationMessage,
  ChatQuickAction,
  ChatSendResult,
  ChatState,
  ChatTextMessage,
  DayOfWeek,
  ExpenseCategory,
  SendChatMessageInput,
} from "@/lib/types";

type AiChatIntent =
  | "create_assignment"
  | "create_class"
  | "create_exam"
  | "log_expense"
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
  forecast?: {
    remaining: number;
    days_left_in_cycle: number;
    avg_daily_spend: number;
    projected_runout_days: number;
    recommended_daily_limit: number;
  };
  free_time?: {
    window_minutes: number;
    next_class_subject: string | null;
    next_class_time: string | null;
    suggested_tasks: Array<{
      title: string;
      due_date: string;
      type: "assignment" | "exam";
      urgency_days: number;
    }>;
  };
  requires_confirmation: boolean;
};

const quickActions: ChatQuickAction[] = [
  {
    id: "quick-task",
    label: "+ Task",
    icon: "assignment_add",
    prompt: "book report next friday 11:59pm",
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
    prompt: "add class",
    kind: "create_class",
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
      freeWindowLabel: `You have ${Math.max(
        1,
        Math.round(response.free_time.window_minutes / 60),
      )} hour${response.free_time.window_minutes >= 120 ? "s" : ""} free`,
      nextClassLabel: response.free_time.next_class_subject
        ? `${response.free_time.next_class_subject} starts at ${response.free_time.next_class_time}`
        : "No more classes are scheduled after this window.",
      recommendations: response.free_time.suggested_tasks.map((task) => ({
        entityId: null,
        kind: task.type,
        title: task.title,
        dueLabel:
          task.urgency_days <= 1
            ? "Due within 1 day"
            : `Due in ${task.urgency_days} days`,
        subjectLabel: task.type === "exam" ? "Exam" : "Assignment",
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

function normalizeExpenseLabelFromMessage(text: string) {
  const match = text.trim().match(/^(.+?)\s+(\d+(?:\.\d{1,2})?)$/);

  if (!match) {
    return null;
  }

  return titleCase(match[1].trim());
}

function getDayIndex(dayOfWeek: DayOfWeek) {
  return getScheduleDayIndex(dayOfWeek);
}

function normalizeTimeValue(value: string) {
  const withSecondsMatch = /^(\d{2}):(\d{2})(?::\d{2})$/.exec(value.trim());

  if (withSecondsMatch) {
    return `${withSecondsMatch[1]}:${withSecondsMatch[2]}`;
  }

  return value.trim();
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

function getClassAction(action: Record<string, unknown> | null) {
  const resolvedDay =
    typeof action?.day_of_week === "string"
      ? action.day_of_week
      : typeof action?.day === "string"
        ? action.day
        : null;

  if (
    !action ||
    typeof action.subject !== "string" ||
    typeof resolvedDay !== "string" ||
    typeof action.start_time !== "string" ||
    typeof action.end_time !== "string"
  ) {
    return null;
  }

  const dayOfWeek = resolvedDay as DayOfWeek;
  const dayIndex = getDayIndex(dayOfWeek);

  if (dayIndex < 0) {
    return null;
  }

  return {
    color: undefined,
    dayIndex,
    dayOfWeek,
    endTime: normalizeTimeValue(action.end_time),
    startTime: normalizeTimeValue(action.start_time),
    subject: action.subject,
  };
}

function getExamAction(action: Record<string, unknown> | null) {
  if (
    !action ||
    typeof action.exam_date !== "string" ||
    typeof action.title !== "string"
  ) {
    return null;
  }

  return {
    title: action.title,
    examAt: action.exam_date,
    classId:
      typeof action.class_id === "string" || action.class_id === null
        ? action.class_id
        : null,
    description:
      typeof action.description === "string" || action.description === null
        ? action.description
        : undefined,
    location:
      typeof action.location === "string" || action.location === null
        ? action.location
        : undefined,
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

function getClientEffect(
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

  if (response.intent === "create_class" && !response.requires_confirmation) {
    const action = getClassAction(response.action);

    if (action) {
      return {
        kind: "create_class",
        payload: action,
      };
    }
  }

  if (response.intent === "create_exam" && !response.requires_confirmation) {
    const action = getExamAction(response.action);

    if (action) {
      return {
        kind: "create_exam",
        payload: action,
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
  const [scheduleWeek, assignments, exams, budgetContext] = await Promise.all([
    getClasses(),
    getAssignments(),
    getExams(),
    getBudgetChatContext(),
  ]);

  const response = await requestBackend<AiChatResponse>("/api/ai/chat", {
    method: "POST",
    body: {
      message: input.text.trim(),
      context: {
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
      },
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

  return {
    clientEffect: getClientEffect(input.text, response),
    userMessage,
    responseMessage: buildTextMessage(
      getClarifyingMessage(response) ?? response.message,
    ),
  };
}

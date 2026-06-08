import type {
  ApiRequestOptions,
  ChatAssignmentConfirmationMessage,
  ChatExpenseConfirmationMessage,
  ChatFreeTimeRecommendationMessage,
  ChatMessage,
  ChatSendResult,
  ChatTextMessage,
  CreateAssignmentInput,
  LogExpenseInput,
  SendChatMessageInput,
} from "@/lib/types";
import { buildBudgetStatusSnapshot } from "@/lib/api/budget";
import { withMockLatency } from "@/lib/api/_mock";
import { appendMockAssignment, listMockAssignments } from "@/lib/mock/assignments";
import {
  appendMockChatMessages,
  listMockChatMessages,
  listMockQuickActions,
} from "@/lib/mock/chat";
import { appendMockExpense } from "@/lib/mock/expenses";
import { getMockScheduleWeek } from "@/lib/mock/schedule";

const weekdayMap = new Map<string, number>([
  ["sunday", 0],
  ["monday", 1],
  ["tuesday", 2],
  ["wednesday", 3],
  ["thursday", 4],
  ["friday", 5],
  ["saturday", 6],
]);

function formatTimeLabel(isoDate: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(isoDate));
}

function formatDueLabel(isoDate: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
    .format(new Date(isoDate))
    .replace(",", " •");
}

function toTitleCase(value: string) {
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase());
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

function parseExpenseInput(text: string): LogExpenseInput | null {
  const match = text.trim().match(/^(.+?)\s+(\d+(?:\.\d{1,2})?)$/);

  if (!match) {
    return null;
  }

  return {
    label: toTitleCase(match[1].trim()),
    amount: Number.parseFloat(match[2]),
  };
}

function getNextWeekday(baseDate: Date, weekday: string) {
  const target = weekdayMap.get(weekday);

  if (target === undefined) {
    return null;
  }

  const next = new Date(baseDate);
  const current = next.getDay();
  const diff = (target - current + 7) % 7 || 7;

  next.setDate(next.getDate() + diff);

  return next;
}

function parseAssignmentInput(input: SendChatMessageInput): CreateAssignmentInput | null {
  const match = input.text
    .trim()
    .match(
      /^(.+?)\s+(?:next\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday)(?:\s+(\d{1,2}:\d{2}\s?(?:am|pm)))?$/i,
    );

  if (!match) {
    return null;
  }

  const baseDate = new Date(input.createdAt ?? new Date().toISOString());
  const title = match[1];
  const weekday = match[2];
  const time = match[3];
  const nextWeekday = getNextWeekday(baseDate, weekday.toLowerCase());

  if (!nextWeekday) {
    return null;
  }

  const timePart = time ?? "11:59 PM";
  const [rawTime, meridiem] = timePart.toUpperCase().split(/\s+/);
  const [rawHour, rawMinute] = rawTime.split(":");
  let hour = Number.parseInt(rawHour, 10);
  const minute = Number.parseInt(rawMinute, 10);

  if (meridiem === "PM" && hour < 12) {
    hour += 12;
  }

  if (meridiem === "AM" && hour === 12) {
    hour = 0;
  }

  nextWeekday.setHours(hour, minute, 0, 0);

  return {
    title: toTitleCase(title.trim()),
    dueAt: nextWeekday.toISOString(),
    subject: "No class",
    classId: null,
  };
}

function buildAssignmentConfirmation(
  assignmentId: string,
  title: string,
  dueAt: string,
  subject: string,
): ChatAssignmentConfirmationMessage {
  return {
    id: crypto.randomUUID(),
    role: "ai",
    kind: "assignment_confirmation",
    createdAt: new Date().toISOString(),
    payload: {
      assignmentId,
      title,
      dueLabel: formatDueLabel(dueAt),
      subjectLabel: subject,
      classLinkLabel: subject === "No class" ? "No class linked" : subject,
      ctaLabel: "View Assignment",
      icon: "assignment",
    },
  };
}

function buildExpenseConfirmation(
  expenseId: string,
  label: string,
  amountLabel: string,
  categoryLabel: string,
  spentAtLabel: string,
): ChatExpenseConfirmationMessage {
  const budget = buildBudgetStatusSnapshot();

  return {
    id: crypto.randomUUID(),
    role: "ai",
    kind: "expense_confirmation",
    createdAt: new Date().toISOString(),
    payload: {
      expenseId,
      label,
      amountLabel,
      categoryLabel,
      spentAtLabel,
      budgetRemainingLabel: budget.remainingLabel,
      budgetTotalLabel: budget.totalLabel,
      progressPercent: budget.progressPercent,
      ctaLabel: "View Expenses",
      icon: "payments",
    },
  };
}

function buildDueTextResponse(): ChatTextMessage {
  const assignments = listMockAssignments()
    .filter((assignment) => assignment.status !== "completed")
    .slice(0, 3)
    .map((assignment, index) => {
      return `${index + 1}. ${assignment.title} — ${assignment.urgency.label.toLowerCase()}`;
    })
    .join("\n");

  return {
    id: crypto.randomUUID(),
    role: "ai",
    kind: "text",
    text:
      assignments.length > 0
        ? `Here’s what’s due next:\n${assignments}`
        : "You’re all caught up right now.",
    createdAt: new Date().toISOString(),
  };
}

function buildFreeTimeRecommendation(): ChatFreeTimeRecommendationMessage {
  const week = getMockScheduleWeek();
  const freeWindow = week.freeWindows[0];
  const nextClass = week.todayClasses[2];
  const recommendations = listMockAssignments()
    .filter((assignment) => assignment.status !== "completed")
    .slice(0, 3)
    .map((assignment) => ({
      assignmentId: assignment.id,
      title: assignment.title,
      dueLabel: assignment.urgency.label,
      subjectLabel: assignment.subject,
      priorityLabel:
        assignment.priority === 3
          ? "High priority"
          : assignment.priority === 2
            ? "Medium priority"
            : "Low priority",
      icon: assignment.icon,
    }));

  return {
    id: crypto.randomUUID(),
    role: "ai",
    kind: "free_time_recommendation",
    createdAt: new Date().toISOString(),
    payload: {
      freeWindowLabel: `You have ${freeWindow.durationMinutes / 60} hours free`,
      nextClassLabel: `${nextClass.subject} starts at ${nextClass.startTime}`,
      recommendations,
      closingText: "Start with the most urgent task while you have the gap.",
    },
  };
}

function buildFallbackResponse(): ChatTextMessage {
  return {
    id: crypto.randomUUID(),
    role: "ai",
    kind: "text",
    text:
      "I can help log an expense, create an assignment, or suggest what to work on next.",
    createdAt: new Date().toISOString(),
  };
}

export async function getChatState(options?: ApiRequestOptions) {
  return withMockLatency(
    () => ({
      messages: listMockChatMessages(),
      quickActions: listMockQuickActions(),
    }),
    options,
  );
}

export async function sendMessage(
  input: SendChatMessageInput,
  options?: ApiRequestOptions,
) {
  return withMockLatency(() => {
    const userMessage = buildUserMessage(input);
    const normalized = input.text.trim().toLowerCase();

    let responseMessage: ChatMessage;

    const expenseInput = parseExpenseInput(input.text);
    const assignmentInput = parseAssignmentInput({
      ...input,
      createdAt: userMessage.createdAt,
    });

    if (expenseInput) {
      const createdExpense = appendMockExpense(expenseInput);

      responseMessage = buildExpenseConfirmation(
        createdExpense.id,
        createdExpense.label,
        createdExpense.amountLabel,
        createdExpense.categoryLabel,
        `${createdExpense.dayLabel}, ${createdExpense.timeLabel}`,
      );
    } else if (assignmentInput) {
      const createdAssignment = appendMockAssignment(assignmentInput);

      responseMessage = buildAssignmentConfirmation(
        createdAssignment.id,
        createdAssignment.title,
        createdAssignment.dueAt,
        createdAssignment.subject,
      );
    } else if (
      normalized.includes("what should i do right now") ||
      normalized.includes("what should i do next")
    ) {
      responseMessage = buildFreeTimeRecommendation();
    } else if (
      normalized.includes("what's due") ||
      normalized.includes("whats due")
    ) {
      responseMessage = buildDueTextResponse();
    } else {
      responseMessage = buildFallbackResponse();
    }

    appendMockChatMessages([userMessage, responseMessage]);

    return {
      userMessage,
      responseMessage,
    } satisfies ChatSendResult;
  }, options);
}

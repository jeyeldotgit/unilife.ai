"use client";

import { routeIntent, type ParsedAction } from "@unilife-ai/parser";

import {
  buildAssignmentConfirmation,
  buildClassConfirmation,
  buildExamConfirmation,
  buildExpenseConfirmation,
} from "@/lib/chat/local-confirmations";
import { buildLocalProposal } from "@/lib/chat/ai-actions";
import { db } from "@/lib/db/dexie";
import {
  createAssignmentLocal,
  createClassLocal,
  createExamLocal,
  getBudgetStatusLocal,
  logExpenseLocal,
} from "@/lib/mutations/local-data";
import {
  buildAllowanceForecast,
  buildFreeTimePlan,
} from "@/lib/planning/deterministic";
import { getLocalPlanningContext } from "@/lib/planning/local-context";
import { getCurrentUserId } from "@/lib/session/current-user";
import type { ChatClientEffect, ChatMessage } from "@/lib/types";

async function addBellItem(input: {
  body: string;
  entityId: string;
  entityType: string;
  title: string;
}) {
  const userId = getCurrentUserId();
  if (!userId) return;
  const createdAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  await db.bell_items.put({
    id: crypto.randomUUID(),
    user_id: userId,
    kind: "ai_result",
    title: input.title,
    body: input.body,
    entity_type: input.entityType,
    entity_id: input.entityId,
    retry_queue_item_id: null,
    read_at: null,
    expires_at: expiresAt,
    created_at: createdAt,
  });
}

export type LocalChatResolution =
  | { handled: true; message: ChatMessage }
  | { handled: false; offlineMessage: ChatMessage };

function buildTextMessage(text: string): ChatMessage {
  return {
    id: crypto.randomUUID(),
    role: "ai",
    kind: "text",
    text,
    createdAt: new Date().toISOString(),
  };
}

function getClarification(action: Extract<ParsedAction, { intent: "unknown" }>) {
  if (action.data.reason) {
    return `${action.data.reason} Try a short, specific command and I can save it locally.`;
  }

  return "I could not safely understand that offline. Try a clearer command or reconnect for a full AI reply.";
}

export function toClientEffect(
  action: Extract<
    ParsedAction,
    { intent: "create_assignment" | "create_class" | "create_exam" | "log_expense" }
  >,
): ChatClientEffect {
  switch (action.intent) {
    case "create_assignment":
      return {
        kind: "create_assignment",
        payload: {
          title: action.data.title,
          dueAt: action.data.due_date,
          classId: null,
        },
      };
    case "create_class": {
      const days = [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
      ] as const;

      return {
        kind: "create_class",
        payload: {
          subject: action.data.subject,
          dayOfWeek: action.data.day_of_week,
          dayIndex: days.indexOf(action.data.day_of_week),
          startTime: action.data.start_time,
          endTime: action.data.end_time,
        },
      };
    }
    case "create_exam":
      return {
        kind: "create_exam",
        payload: {
          title: action.data.title,
          examAt: action.data.exam_date,
          location: action.data.location,
          classId: null,
        },
      };
    case "log_expense":
      return {
        kind: "log_expense",
        payload: {
          amount: action.data.amount,
          label: action.data.label,
          category: action.data.category,
        },
      };
  }
}

function formatFreeWindow(minutes: number) {
  if (minutes < 60) return `You have ${minutes} minutes free`;
  return `You have ${Math.floor(minutes / 60)}h ${minutes % 60}m free`;
}

async function buildPlanningFallback(
  intent: "query_free_time" | "query_allowance_forecast",
): Promise<ChatMessage> {
  const context = await getLocalPlanningContext();

  if (!context) {
    return buildTextMessage("I cannot access your saved planning data in this browser session yet.");
  }

  if (intent === "query_free_time") {
    const plan = buildFreeTimePlan(context);
    if (!plan) return buildTextMessage("I could not calculate your free time right now.");

    return {
      id: crypto.randomUUID(),
      role: "ai",
      kind: "free_time_recommendation",
      createdAt: new Date().toISOString(),
      payload: {
        freeWindowLabel: plan.current_class_subject
          ? `You are currently in ${plan.current_class_subject}`
          : formatFreeWindow(plan.window_minutes),
        nextClassLabel: plan.next_class_subject
          ? `${plan.next_class_subject} starts at ${plan.next_class_time}`
          : "No more classes are scheduled after this window.",
        recommendations: plan.suggested_tasks.map((task) => ({
          entityId: task.id ?? null,
          kind: task.type,
          title: task.title,
          dueLabel: task.urgency_days <= 1 ? "Due within 1 day" : `Due in ${task.urgency_days} days`,
          subjectLabel: task.subject ?? "No class",
          typeLabel: task.type === "exam" ? "Exam" : "Assignment",
          priorityLabel: task.urgency_days <= 2 ? "High priority" : "Upcoming",
          icon: task.type === "exam" ? "quiz" : "assignment",
        })),
        closingText: "This recommendation uses your saved local schedule and deadlines.",
      },
    };
  }

  const forecast = buildAllowanceForecast(context);
  if (!forecast) {
    return buildTextMessage("Set an active budget cycle to calculate an allowance forecast.");
  }

  return {
    id: crypto.randomUUID(),
    role: "ai",
    kind: "allowance_forecast",
    createdAt: new Date().toISOString(),
    payload: {
      ...forecast,
      closingText: "This forecast uses your saved local budget and expenses.",
    },
  };
}

export async function executeChatClientEffect(
  effect: ChatClientEffect,
): Promise<ChatMessage> {
  switch (effect.kind) {
    case "create_assignment": {
      const assignment = await createAssignmentLocal(effect.payload);
      await addBellItem({
        body: assignment.title,
        entityId: assignment.id,
        entityType: "assignment",
        title: "Assignment added by AI",
      });
      return buildAssignmentConfirmation(assignment);
    }
    case "create_class": {
      const classRecord = await createClassLocal(effect.payload);
      return buildClassConfirmation({
        id: classRecord.id,
        subject: classRecord.subject,
        dayOfWeek: classRecord.day_of_week,
        startTime: classRecord.start_time,
        endTime: classRecord.end_time,
        room: classRecord.room,
      });
    }
    case "create_exam": {
      const exam = await createExamLocal(effect.payload);
      return buildExamConfirmation(exam);
    }
    case "log_expense": {
      const expense = await logExpenseLocal(effect.payload);
      const budgetStatus = await getBudgetStatusLocal();
      await addBellItem({
        body: `${expense.amountLabel} · ${expense.categoryLabel}`,
        entityId: expense.id,
        entityType: "expense",
        title: "Expense logged by AI",
      });
      return buildExpenseConfirmation(expense, budgetStatus);
    }
  }
}

function formatDeadline(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));
}

async function buildDeadlineMessage(range: "today" | "next_seven_days") {
  const userId = getCurrentUserId();

  if (!userId) {
    return buildTextMessage(
      "I cannot access your saved deadlines in this browser session yet.",
    );
  }

  const now = new Date();
  const end = new Date(now);
  if (range === "today") {
    end.setHours(23, 59, 59, 999);
  } else {
    end.setDate(end.getDate() + 7);
  }

  const [assignments, exams] = await Promise.all([
    db.assignments
      .where("user_id")
      .equals(userId)
      .and(
        (record) =>
          record.deleted_at === null &&
          record.status !== "completed" &&
          new Date(record.due_date) >= now &&
          new Date(record.due_date) <= end,
      )
      .toArray(),
    db.exams
      .where("user_id")
      .equals(userId)
      .and(
        (record) =>
          record.deleted_at === null &&
          new Date(record.exam_date) >= now &&
          new Date(record.exam_date) <= end,
      )
      .toArray(),
  ]);

  const deadlines = [
    ...assignments.map((record) => ({
      at: record.due_date,
      title: record.title,
      type: "Assignment",
    })),
    ...exams.map((record) => ({
      at: record.exam_date,
      title: record.title,
      type: "Exam",
    })),
  ]
    .sort((left, right) => left.at.localeCompare(right.at))
    .slice(0, 5);

  if (deadlines.length === 0) {
    return buildTextMessage(
      range === "today"
        ? "You have no saved deadlines due today."
        : "You have no saved deadlines in the next seven days.",
    );
  }

  return buildTextMessage(
    `Here are your next deadlines:\n${deadlines
      .map(
        (deadline, index) =>
          `${index + 1}. ${deadline.title} (${deadline.type}) - ${formatDeadline(deadline.at)}`,
      )
      .join("\n")}`,
  );
}

export async function resolveLocalChat(text: string): Promise<LocalChatResolution> {
  const action = routeIntent(text);

  if (action.intent === "unknown") {
    return {
      handled: false,
      offlineMessage: buildTextMessage(getClarification(action)),
    };
  }

  if (action.intent === "query_deadlines") {
    return {
      handled: true,
      message: await buildDeadlineMessage(action.data.range),
    };
  }

  if (
    action.intent === "query_free_time" ||
    action.intent === "query_allowance_forecast"
  ) {
    return {
      handled: false,
      offlineMessage: await buildPlanningFallback(action.intent),
    };
  }

  if (action.intent === "create_assignment" || action.intent === "log_expense") {
    const message = await executeChatClientEffect(toClientEffect(action));

    return {
      handled: true,
      message,
    };
  }

  const proposed =
    action.intent === "create_class"
      ? action.data
      : {
          title: action.data.title,
          exam_date: action.data.exam_date,
          location: action.data.location ?? null,
          class_id: null,
        };
  const entityType = action.intent === "create_class" ? "class" : "exam";
  const proposal = buildLocalProposal(entityType, proposed, action.confidence);

  return {
    handled: true,
    message: {
      id: crypto.randomUUID(),
      role: "ai",
      kind: "proposal_review",
      payload: proposal,
      createdAt: new Date().toISOString(),
    },
  };
}

"use client";

import { routeIntent, type ParsedAction } from "@unilife-ai/parser";

import {
  buildAssignmentConfirmation,
  buildClassConfirmation,
  buildExamConfirmation,
  buildExpenseConfirmation,
} from "@/lib/chat/local-confirmations";
import { db } from "@/lib/db/dexie";
import {
  createAssignmentLocal,
  createClassLocal,
  createExamLocal,
  getBudgetStatusLocal,
  logExpenseLocal,
} from "@/lib/mutations/local-data";
import { getCurrentUserId } from "@/lib/session/current-user";
import type { ChatClientEffect, ChatMessage } from "@/lib/types";

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

function toClientEffect(
  action: Exclude<ParsedAction, { intent: "unknown" | "query_deadlines" }>,
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

export async function executeChatClientEffect(
  effect: ChatClientEffect,
): Promise<ChatMessage> {
  switch (effect.kind) {
    case "create_assignment": {
      const assignment = await createAssignmentLocal(effect.payload);
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

  return {
    handled: true,
    message: await executeChatClientEffect(toClientEffect(action)),
  };
}

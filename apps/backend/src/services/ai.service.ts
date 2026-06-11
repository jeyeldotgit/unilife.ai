import type { SupabaseClient } from "@supabase/supabase-js";
import {
  callGemini,
  type GeminiChatResponse,
  type GeminiIntent,
} from "@unilife-ai/ai-core";
import { z } from "zod";

import {
  AILogsRepository,
  type CreateAILogInput,
} from "../repositories/ai-logs.repository.js";

const AI_CONFIDENCE_THRESHOLD = 0.7;
const AI_CHAT_SYSTEM_PROMPT = [
  "Convert the student's message into one supported UniLife chat intent.",
  "Use the provided frontend context when it helps answer schedule, deadline, budget, free-time, or allowance questions.",
  "For structured create or log intents, fill action with only the fields you can confidently infer.",
  "For non-CRUD intents, set action to null.",
  "Always include a confidence number between 0 and 1.",
].join("\n");
const expenseCategorySchema = z.enum([
  "food",
  "transportation",
  "school",
  "entertainment",
  "miscellaneous",
]);
const dayOfWeekSchema = z.enum([
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
]);
const aiChatIntentSchema = z.enum([
  "create_assignment",
  "create_class",
  "create_exam",
  "log_expense",
  "query_schedule",
  "query_deadlines",
  "query_budget",
  "free_time_finder",
  "allowance_forecast",
  "general_question",
  "unknown",
]);
const freeTimeTaskSchema = z.object({
  title: z.string(),
  due_date: z.string(),
  type: z.enum(["assignment", "exam"]),
  urgency_days: z.number().int(),
});
const aiForecastSchema = z.object({
  remaining: z.number(),
  days_left_in_cycle: z.number().int(),
  avg_daily_spend: z.number(),
  projected_runout_days: z.number().int(),
  recommended_daily_limit: z.number(),
});
const aiFreeTimeSchema = z.object({
  window_minutes: z.number().int(),
  next_class_subject: z.string().nullable(),
  next_class_time: z.string().nullable(),
  suggested_tasks: z.array(freeTimeTaskSchema),
});
const aiChatResponseSchema = z.object({
  intent: aiChatIntentSchema,
  action: z.record(z.string(), z.unknown()).nullable(),
  message: z.string(),
  forecast: aiForecastSchema.optional(),
  free_time: aiFreeTimeSchema.optional(),
  requires_confirmation: z.boolean(),
});

export type AIChatContext = {
  today: string;
  current_time: string;
  todays_classes: Array<{
    subject: string;
    start_time: string;
    end_time: string;
  }>;
  upcoming_deadlines: Array<{
    title: string;
    due_date: string;
    type: "assignment" | "exam";
    status: "pending" | "in_progress";
  }>;
  budget_remaining: number | null;
  budget_period_end_date: string | null;
  avg_daily_spend: number | null;
};

export type AIChatInput = {
  message: string;
  context: AIChatContext;
};

export type AIChatResponse = z.infer<typeof aiChatResponseSchema>;

type ChatLogPayload = Omit<
  CreateAILogInput,
  "id" | "processing_layer" | "user_id"
>;

type ProcessChatResult = {
  response: AIChatResponse;
  log: ChatLogPayload;
};

type GeminiCaller = typeof callGemini;

function isStructuredIntent(intent: GeminiIntent) {
  return (
    intent === "create_assignment" ||
    intent === "create_class" ||
    intent === "create_exam" ||
    intent === "log_expense"
  );
}

function toMinutes(value: string) {
  const match = /^(\d{2}):(\d{2})$/.exec(value);

  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (hours > 23 || minutes > 59) {
    return null;
  }

  return hours * 60 + minutes;
}

function toUtcMidnight(dateString: string) {
  const date = new Date(`${dateString}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function diffCalendarDaysInclusive(startDate: string, endDate: string) {
  const start = toUtcMidnight(startDate);
  const end = toUtcMidnight(endDate);

  if (!start || !end) {
    return null;
  }

  const dayMs = 24 * 60 * 60 * 1000;
  const difference = Math.floor((end.getTime() - start.getTime()) / dayMs) + 1;

  return Math.max(1, difference);
}

function diffCalendarDays(startDate: string, endDateTime: string) {
  const start = toUtcMidnight(startDate);
  const endDate = new Date(endDateTime);

  if (!start || Number.isNaN(endDate.getTime())) {
    return null;
  }

  const end = new Date(
    Date.UTC(
      endDate.getUTCFullYear(),
      endDate.getUTCMonth(),
      endDate.getUTCDate(),
    ),
  );
  const dayMs = 24 * 60 * 60 * 1000;

  return Math.max(0, Math.floor((end.getTime() - start.getTime()) / dayMs));
}

function resolveRelativeDay(
  value: string,
  today: string,
): z.infer<typeof dayOfWeekSchema> | null {
  const normalized = value.trim().toLowerCase();

  if (!normalized) {
    return null;
  }

  const directDay = dayOfWeekSchema.safeParse(normalized);

  if (directDay.success) {
    return directDay.data;
  }

  const todayDate = toUtcMidnight(today);

  if (!todayDate) {
    return null;
  }

  if (normalized === "today") {
    return dayOfWeekSchema.enum[
      ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][
        todayDate.getUTCDay()
      ] as keyof typeof dayOfWeekSchema.enum
    ];
  }

  if (normalized === "tomorrow") {
    const tomorrow = new Date(todayDate);
    tomorrow.setUTCDate(todayDate.getUTCDate() + 1);

    return dayOfWeekSchema.enum[
      ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][
        tomorrow.getUTCDay()
      ] as keyof typeof dayOfWeekSchema.enum
    ];
  }

  return null;
}

function normalizeCreateAssignmentAction(
  action: Record<string, unknown> | null,
) {
  if (
    !action ||
    typeof action.title !== "string" ||
    typeof action.due_date !== "string"
  ) {
    return null;
  }

  const normalized: Record<string, unknown> = {
    title: action.title,
    due_date: action.due_date,
  };

  if (typeof action.class_id === "string" || action.class_id === null) {
    normalized.class_id = action.class_id;
  }

  return normalized;
}

function normalizeCreateClassAction(
  action: Record<string, unknown> | null,
  context: AIChatContext,
) {
  if (!action || typeof action.subject !== "string") {
    return null;
  }

  const dayOfWeek =
    typeof action.day_of_week === "string"
      ? resolveRelativeDay(action.day_of_week, context.today)
      : typeof action.day === "string"
        ? resolveRelativeDay(action.day, context.today)
        : null;

  if (!dayOfWeek) {
    return null;
  }

  if (
    typeof action.start_time !== "string" ||
    typeof action.end_time !== "string"
  ) {
    return null;
  }

  return {
    subject: action.subject,
    day_of_week: dayOfWeek,
    start_time: action.start_time,
    end_time: action.end_time,
  };
}

function normalizeCreateExamAction(action: Record<string, unknown> | null) {
  if (!action || typeof action.exam_date !== "string") {
    return null;
  }

  const normalized: Record<string, unknown> = {
    exam_date: action.exam_date,
  };

  if (typeof action.title === "string") {
    normalized.title = action.title;
  }

  if (typeof action.class_id === "string" || action.class_id === null) {
    normalized.class_id = action.class_id;
  }

  if (typeof action.location === "string" || action.location === null) {
    normalized.location = action.location;
  }

  return normalized;
}

function normalizeLogExpenseAction(action: Record<string, unknown> | null) {
  if (!action || typeof action.amount !== "number") {
    return null;
  }

  const normalized: Record<string, unknown> = {
    amount: action.amount,
  };
  const category = expenseCategorySchema.safeParse(action.category);

  if (category.success) {
    normalized.category = category.data;
  }

  return normalized;
}

function normalizeAction(
  intent: GeminiIntent,
  action: Record<string, unknown> | null,
  context: AIChatContext,
) {
  switch (intent) {
    case "create_assignment":
      return normalizeCreateAssignmentAction(action);
    case "create_class":
      return normalizeCreateClassAction(action, context);
    case "create_exam":
      return normalizeCreateExamAction(action);
    case "log_expense":
      return normalizeLogExpenseAction(action);
    default:
      return null;
  }
}

function buildForecast(context: AIChatContext) {
  if (
    context.budget_remaining === null ||
    context.budget_period_end_date === null ||
    context.avg_daily_spend === null
  ) {
    return undefined;
  }

  const daysLeftInCycle = diffCalendarDaysInclusive(
    context.today,
    context.budget_period_end_date,
  );

  if (!daysLeftInCycle) {
    return undefined;
  }

  const projectedRunoutDays =
    context.avg_daily_spend > 0
      ? Math.floor(context.budget_remaining / context.avg_daily_spend)
      : daysLeftInCycle;

  return {
    remaining: context.budget_remaining,
    days_left_in_cycle: daysLeftInCycle,
    avg_daily_spend: context.avg_daily_spend,
    projected_runout_days: projectedRunoutDays,
    recommended_daily_limit: context.budget_remaining / daysLeftInCycle,
  };
}

function buildFreeTime(context: AIChatContext) {
  const currentMinutes = toMinutes(context.current_time);

  if (currentMinutes === null) {
    return undefined;
  }

  const sortedClasses = [...context.todays_classes].sort((left, right) => {
    const leftMinutes = toMinutes(left.start_time) ?? Number.MAX_SAFE_INTEGER;
    const rightMinutes = toMinutes(right.start_time) ?? Number.MAX_SAFE_INTEGER;

    return leftMinutes - rightMinutes;
  });
  const nextClass =
    sortedClasses.find((classItem) => {
      const startMinutes = toMinutes(classItem.start_time);

      return startMinutes !== null && startMinutes > currentMinutes;
    }) ?? null;
  const nextClassMinutes = nextClass
    ? toMinutes(nextClass.start_time)
    : 24 * 60;
  const windowMinutes = Math.max(
    0,
    (nextClassMinutes ?? 24 * 60) - currentMinutes,
  );
  const suggestedTasks = [...context.upcoming_deadlines]
    .sort((left, right) => {
      const leftTime = Date.parse(left.due_date);
      const rightTime = Date.parse(right.due_date);

      if (Number.isNaN(leftTime) && Number.isNaN(rightTime)) {
        return 0;
      }

      if (Number.isNaN(leftTime)) {
        return 1;
      }

      if (Number.isNaN(rightTime)) {
        return -1;
      }

      return leftTime - rightTime;
    })
    .map((deadline) => ({
      title: deadline.title,
      due_date: deadline.due_date,
      type: deadline.type,
      urgency_days: diffCalendarDays(context.today, deadline.due_date) ?? 0,
    }));

  return {
    window_minutes: windowMinutes,
    next_class_subject: nextClass?.subject ?? null,
    next_class_time: nextClass?.start_time ?? null,
    suggested_tasks: suggestedTasks,
  };
}

function createFallbackResponse(): AIChatResponse {
  return {
    intent: "unknown",
    action: null,
    message: "I couldn't understand that. Try rephrasing.",
    requires_confirmation: false,
  };
}

function toStructuredOutput(raw: GeminiChatResponse) {
  const output: Record<string, unknown> = {
    intent: raw.intent,
    action: raw.action,
    message: raw.message,
    confidence: raw.confidence,
  };

  return output;
}

function sanitizeActionRecord(action: GeminiChatResponse["action"]) {
  return action ?? null;
}

export class AIService {
  private readonly logsRepository: AILogsRepository;
  private readonly geminiCaller: GeminiCaller;

  constructor(
    supabase: SupabaseClient,
    private readonly userId: string,
    logsRepository = new AILogsRepository(supabase),
    geminiCaller: GeminiCaller = callGemini,
  ) {
    this.logsRepository = logsRepository;
    this.geminiCaller = geminiCaller;
  }

  async processChat(input: AIChatInput): Promise<ProcessChatResult> {
    try {
      const raw = await this.geminiCaller({
        message: input.message,
        systemPrompt: AI_CHAT_SYSTEM_PROMPT,
        context: input.context,
      });
      const action = sanitizeActionRecord(raw.action);
      const normalizedAction = normalizeAction(raw.intent, action, input.context);
      const response = aiChatResponseSchema.parse({
        intent: raw.intent,
        action: isStructuredIntent(raw.intent) ? normalizedAction : null,
        message: raw.message,
        forecast:
          raw.intent === "allowance_forecast"
            ? buildForecast(input.context)
            : undefined,
        free_time:
          raw.intent === "free_time_finder"
            ? buildFreeTime(input.context)
            : undefined,
        requires_confirmation:
          (isStructuredIntent(raw.intent) && normalizedAction === null) ||
          (isStructuredIntent(raw.intent) &&
            raw.confidence < AI_CONFIDENCE_THRESHOLD),
      });

      return {
        response,
        log: {
          raw_input: input.message,
          detected_intent: raw.intent,
          confidence: raw.confidence,
          structured_output: toStructuredOutput(raw),
          error: null,
        },
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown Gemini error.";

      return {
        response: createFallbackResponse(),
        log: {
          raw_input: input.message,
          detected_intent: null,
          confidence: null,
          structured_output: null,
          error: message,
        },
      };
    }
  }

  async logChat(log: ChatLogPayload) {
    await this.logsRepository.create({
      id: crypto.randomUUID(),
      user_id: this.userId,
      processing_layer: "gemini",
      ...log,
    });
  }
}

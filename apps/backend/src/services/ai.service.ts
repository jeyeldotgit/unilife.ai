import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildDailyBriefingPrompt,
  buildScheduleInsightPrompt,
  callGemini,
  type GeminiChatResponse,
  type GeminiIntent,
} from "@unilife-ai/ai-core";
import type {
  AiProposal,
  DailyBriefing,
  PlanningContext,
  ScheduleInsight,
  ScheduleInsightContext,
} from "@unilife-ai/types";
import { z } from "zod";

import {
  AILogsRepository,
  type CreateAILogInput,
} from "../repositories/ai-logs.repository.js";
import {
  buildAllowanceForecast,
  buildDeterministicBriefing,
  buildDeterministicScheduleInsight,
  buildFreeTimePlan,
  detectPlanningIntent,
} from "./planning.service.js";

const AI_CONFIDENCE_THRESHOLD = 0.7;
const AI_CHAT_SYSTEM_PROMPT = [
  "Convert the student's message into one supported UniLife chat intent.",
  "Use the provided frontend context when it helps answer schedule, deadline, budget, free-time, or allowance questions.",
  "For structured create or log intents, fill action with only the fields you can confidently infer.",
  "For update or delete intents, use only an entity_id present in the provided frontend entities context.",
  "Never invent an entity_id.",
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
  "update_assignment",
  "delete_assignment",
  "create_class",
  "update_class",
  "delete_class",
  "create_exam",
  "update_exam",
  "delete_exam",
  "log_expense",
  "delete_expense",
  "query_schedule",
  "query_deadlines",
  "query_budget",
  "free_time_finder",
  "allowance_forecast",
  "general_question",
  "unknown",
]);
const freeTimeTaskSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  due_date: z.string(),
  type: z.enum(["assignment", "exam"]),
  status: z.enum(["pending", "in_progress"]),
  subject: z.string().optional(),
  priority: z.number().optional(),
  urgency_days: z.number().int(),
});
const aiForecastSchema = z.object({
  remaining: z.number(),
  days_left_in_cycle: z.number().int(),
  avg_daily_spend: z.number(),
  projected_runout_days: z.number().int().nullable(),
  projected_runout_date: z.string().nullable(),
  recommended_daily_limit: z.number(),
  will_last_cycle: z.boolean(),
});
const aiFreeTimeSchema = z.object({
  window_minutes: z.number().int(),
  current_class_subject: z.string().nullable(),
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
  proposal: z.custom<AiProposal>().nullable(),
});

export type AIChatContext = PlanningContext & {
  entities?: Array<{
    id: string;
    entity_type: "class" | "assignment" | "exam" | "expense";
    label: string;
  }>;
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
    intent === "update_assignment" ||
    intent === "delete_assignment" ||
    intent === "create_class" ||
    intent === "update_class" ||
    intent === "delete_class" ||
    intent === "create_exam" ||
    intent === "update_exam" ||
    intent === "delete_exam" ||
    intent === "log_expense" ||
    intent === "delete_expense"
  );
}

function toUtcMidnight(dateString: string) {
  const date = new Date(`${dateString}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
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
    case "update_assignment":
    case "update_class":
    case "update_exam":
      return action && typeof action.entity_id === "string" ? action : null;
    case "delete_assignment":
    case "delete_class":
    case "delete_exam":
    case "delete_expense":
      return action && typeof action.entity_id === "string"
        ? { entity_id: action.entity_id }
        : null;
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

function createFallbackResponse(): AIChatResponse {
  return {
    intent: "unknown",
    action: null,
    message: "I couldn't understand that. Try rephrasing.",
    requires_confirmation: false,
    proposal: null,
  };
}

function createPlanningFallbackResponse(
  message: string,
  context: AIChatContext,
): AIChatResponse | null {
  const intent = detectPlanningIntent(message);

  if (intent === "free_time_finder") {
    return {
      intent,
      action: null,
      message: "Here is a recommendation based on your saved schedule and deadlines.",
      free_time: buildFreeTimePlan(context),
      requires_confirmation: false,
      proposal: null,
    };
  }

  if (intent === "allowance_forecast") {
    return {
      intent,
      action: null,
      message: "Here is a forecast based on your current budget cycle and spending.",
      forecast: buildAllowanceForecast(context),
      requires_confirmation: false,
      proposal: null,
    };
  }

  return null;
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

function getEntityType(intent: GeminiIntent) {
  switch (intent) {
    case "create_assignment":
    case "update_assignment":
    case "delete_assignment":
      return "assignment" as const;
    case "create_class":
    case "update_class":
    case "delete_class":
      return "class" as const;
    case "create_exam":
    case "update_exam":
    case "delete_exam":
      return "exam" as const;
    case "log_expense":
    case "delete_expense":
      return "expense" as const;
    default:
      return null;
  }
}

function buildProposal(
  intent: GeminiIntent,
  action: Record<string, unknown> | null,
  confidence: number,
): AiProposal | null {
  const entityType = getEntityType(intent);
  if (!entityType || !action) return null;

  const timestamp = new Date().toISOString();
  const entityId = typeof action.entity_id === "string" ? action.entity_id : null;
  const proposed = { ...action };
  delete proposed.entity_id;
  const operation =
    intent.startsWith("delete_")
      ? "delete"
      : intent.startsWith("update_")
        ? "update"
        : "create";
  return {
    id: crypto.randomUUID(),
    processing_layer: "gemini",
    status: "proposed",
    operations: [
      {
        id: crypto.randomUUID(),
        operation,
        entity_type: entityType,
        entity_id: entityId,
        before: null,
        proposed,
        uncertain_fields: confidence < AI_CONFIDENCE_THRESHOLD ? Object.keys(proposed) : [],
        confidence,
        status: "proposed",
        approved_payload: null,
        applied_revision: null,
        error: null,
      },
    ],
    created_at: timestamp,
    updated_at: timestamp,
  };
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
      const forecast =
        raw.intent === "allowance_forecast"
          ? buildAllowanceForecast(input.context)
          : undefined;
      const freeTime =
        raw.intent === "free_time_finder"
          ? buildFreeTimePlan(input.context)
          : undefined;
      const response = aiChatResponseSchema.parse({
        intent: raw.intent,
        action: isStructuredIntent(raw.intent) ? normalizedAction : null,
        message: raw.message,
        ...(forecast ? { forecast } : {}),
        ...(freeTime ? { free_time: freeTime } : {}),
        requires_confirmation: isStructuredIntent(raw.intent),
        proposal: buildProposal(raw.intent, normalizedAction, raw.confidence),
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
        response:
          createPlanningFallbackResponse(input.message, input.context) ??
          createFallbackResponse(),
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

  async createBriefing(context: AIChatContext): Promise<DailyBriefing> {
    const deterministic = buildDeterministicBriefing(context);

    try {
      const raw = await this.geminiCaller({
        message: "Create my daily briefing.",
        systemPrompt: buildDailyBriefingPrompt(),
        context: {
          ...context,
          deterministic_briefing: deterministic,
        },
      });

      return {
        ...deterministic,
        message: raw.message,
        source: "ai",
      };
    } catch {
      return deterministic;
    }
  }

  async createScheduleInsight(
    context: ScheduleInsightContext,
  ): Promise<ScheduleInsight> {
    const deterministic = buildDeterministicScheduleInsight(context);

    try {
      const raw = await this.geminiCaller({
        message: "Create a schedule-specific insight for today.",
        systemPrompt: buildScheduleInsightPrompt(),
        context: {
          today: context.today,
          current_time: context.current_time,
          todays_classes: context.todays_classes,
          deterministic_schedule_insight: deterministic,
        },
      });

      return {
        ...deterministic,
        message: raw.message,
        source: "ai",
      };
    } catch {
      return deterministic;
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

import { z } from "zod";

const geminiIntentSchema = z.enum([
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

const geminiChatResponseSchema = z
  .object({
    intent: geminiIntentSchema,
    action: z.record(z.string(), z.unknown()).nullable(),
    message: z.string().trim().min(1),
    confidence: z.number().min(0).max(1),
  })
  .strict();

export type GeminiIntent = z.infer<typeof geminiIntentSchema>;
export type GeminiChatResponse = z.infer<typeof geminiChatResponseSchema>;

export type GeminiCallRequest = {
  message: string;
  systemPrompt: string;
  context?: Record<string, unknown>;
};

function stripCodeFences(value: string) {
  const trimmed = value.trim();

  if (!trimmed.startsWith("```")) {
    return trimmed;
  }

  return trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
}

export function parseGeminiResponse(text: string) {
  const normalized = stripCodeFences(text);
  const parsed = JSON.parse(normalized) as unknown;

  return geminiChatResponseSchema.parse(parsed);
}

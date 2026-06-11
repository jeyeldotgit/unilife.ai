import { normalizeInput } from "./preprocess.js";
import {
  tryCreateAssignment,
  tryCreateClass,
  tryCreateExam,
  tryLogExpense,
  tryQueryDeadlines,
} from "./intents/index.js";
import { ParsedActionSchema, type ParsedAction } from "./schemas/parsed-action.js";

const AI_CONFIDENCE_THRESHOLD = 0.7;

export type RouteIntentOptions = {
  referenceDate?: Date;
};

export function routeIntent(input: string, options: RouteIntentOptions = {}): ParsedAction {
  const normalizedInput = normalizeInput(input);
  const referenceDate = options.referenceDate ?? new Date();
  const handlers = [
    () => tryQueryDeadlines(normalizedInput),
    () => tryCreateClass(normalizedInput),
    () => tryCreateExam(normalizedInput, referenceDate),
    () => tryCreateAssignment(normalizedInput, referenceDate),
    () => tryLogExpense(normalizedInput),
  ];

  for (const handler of handlers) {
    const candidate = handler();

    if (!candidate) {
      continue;
    }

    const parsed = ParsedActionSchema.safeParse(candidate);
    if (!parsed.success) {
      return {
        intent: "unknown",
        confidence: 0,
        data: { reason: "The parsed command was not safe to execute." },
      };
    }

    if (
      parsed.data.intent === "unknown" ||
      parsed.data.confidence >= AI_CONFIDENCE_THRESHOLD
    ) {
      return parsed.data;
    }
  }

  return { intent: "unknown", confidence: 0, data: {} };
}

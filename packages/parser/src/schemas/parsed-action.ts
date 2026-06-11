import { z } from "zod";

const ConfidenceSchema = z.number().min(0).max(1);
const IsoDateSchema = z.string().datetime({ offset: true });
const TimeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

export const DayOfWeekSchema = z.enum([
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
]);

export const ExpenseCategorySchema = z.enum([
  "food",
  "transportation",
  "school",
  "entertainment",
  "miscellaneous",
]);

export const ParsedActionSchema = z.discriminatedUnion("intent", [
  z.object({
    intent: z.literal("create_assignment"),
    confidence: ConfidenceSchema,
    data: z.object({
      title: z.string().trim().min(1),
      due_date: IsoDateSchema,
    }),
  }),
  z.object({
    intent: z.literal("create_class"),
    confidence: ConfidenceSchema,
    data: z
      .object({
        subject: z.string().trim().min(1),
        day_of_week: DayOfWeekSchema,
        start_time: TimeSchema,
        end_time: TimeSchema,
      })
      .refine((value) => value.start_time < value.end_time, {
        message: "Class end time must be after its start time.",
      }),
  }),
  z.object({
    intent: z.literal("create_exam"),
    confidence: ConfidenceSchema,
    data: z.object({
      title: z.string().trim().min(1),
      exam_date: IsoDateSchema,
      location: z.string().trim().min(1).optional(),
    }),
  }),
  z.object({
    intent: z.literal("log_expense"),
    confidence: ConfidenceSchema,
    data: z.object({
      amount: z.number().positive(),
      label: z.string().trim().min(1),
      category: ExpenseCategorySchema,
    }),
  }),
  z.object({
    intent: z.literal("query_deadlines"),
    confidence: ConfidenceSchema,
    data: z.object({
      range: z.enum(["today", "next_seven_days"]),
    }),
  }),
  z.object({
    intent: z.literal("unknown"),
    confidence: ConfidenceSchema,
    data: z.object({
      candidate_intent: z
        .enum([
          "create_assignment",
          "create_class",
          "create_exam",
          "log_expense",
          "query_deadlines",
        ])
        .optional(),
      reason: z.string().optional(),
    }),
  }),
]);

export type ParsedAction = z.infer<typeof ParsedActionSchema>;
export type ExecutableParsedAction = Exclude<ParsedAction, { intent: "unknown" }>;

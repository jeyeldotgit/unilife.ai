import { Hono } from "hono";
import { z } from "zod";

import { ExpensesController } from "../controllers/expenses.controller.js";
import type { AppBindings } from "../lib/hono.js";
import { parseJsonBody, parseParams, parseQuery } from "../lib/validation.js";
import { requireAuth } from "../middleware/auth.js";

const expenseCategorySchema = z.enum([
  "food",
  "transportation",
  "school",
  "entertainment",
  "miscellaneous",
]);
const isoDateTimeSchema = z
  .string()
  .refine((value) => !Number.isNaN(Date.parse(value)), {
    message: "Invalid ISO datetime.",
  });
const isoDateSchema = z
  .string()
  .refine(
    (value) =>
      /^\d{4}-\d{2}-\d{2}$/.test(value) &&
      !Number.isNaN(Date.parse(`${value}T00:00:00.000Z`)),
    {
      message: "Invalid ISO date.",
    },
  );
const idParamsSchema = z.object({
  id: z.string().uuid(),
});
const listExpensesQuerySchema = z.object({
  since: isoDateTimeSchema.optional(),
  from: isoDateSchema.optional(),
  to: isoDateSchema.optional(),
  from_at: isoDateTimeSchema.optional(),
  to_at: isoDateTimeSchema.optional(),
  category: expenseCategorySchema.optional(),
}).refine(
  (value) => !value.from_at || !value.to_at || Date.parse(value.from_at) <= Date.parse(value.to_at),
  { message: "from_at must not be after to_at." },
);
const recurrenceSchema = z.record(z.string(), z.unknown()).nullable().optional();
const createExpenseSchema = z
  .object({
    id: z.string().uuid(),
    budget_id: z.string().uuid().nullable().optional(),
    refund_of_expense_id: z.string().uuid().nullable().optional(),
    amount: z.number().refine((value) => value !== 0, "Amount must not be zero."),
    category: expenseCategorySchema,
    description: z.string().trim().min(1).max(2000).optional(),
    spent_at: isoDateTimeSchema.optional(),
    recurrence: recurrenceSchema,
    created_at: isoDateTimeSchema,
    updated_at: isoDateTimeSchema,
  })
  .strict();
const updateExpenseSchema = z
  .object({
    amount: z.number().positive().optional(),
    category: expenseCategorySchema.optional(),
    description: z.string().trim().min(1).max(2000).nullable().optional(),
    spent_at: isoDateTimeSchema.optional(),
    recurrence: recurrenceSchema,
    edit_scope: z.enum(["occurrence", "future", "series"]).optional(),
    updated_at: isoDateTimeSchema,
  })
  .strict();
const deleteExpenseQuerySchema = z.object({
  edit_scope: z.enum(["occurrence", "future", "series"]).optional(),
});

export const expensesRouter = new Hono<AppBindings>();

expensesRouter.use("*", requireAuth);

expensesRouter.get("/", async (c) => {
  const input = parseQuery(c, listExpensesQuerySchema);
  const controller = new ExpensesController(c.get("supabase"), c.get("userId"));

  return c.json(await controller.list(input), 200);
});

expensesRouter.post("/", async (c) => {
  const input = await parseJsonBody(c, createExpenseSchema);
  const controller = new ExpensesController(c.get("supabase"), c.get("userId"));

  return c.json(await controller.create(input), 201);
});

expensesRouter.patch("/:id", async (c) => {
  const { id } = parseParams(c, idParamsSchema);
  const input = await parseJsonBody(c, updateExpenseSchema);
  const controller = new ExpensesController(c.get("supabase"), c.get("userId"));
  return c.json(await controller.update(id, input), 200);
});

expensesRouter.delete("/:id", async (c) => {
  const { id } = parseParams(c, idParamsSchema);
  const input = parseQuery(c, deleteExpenseQuerySchema);
  const controller = new ExpensesController(c.get("supabase"), c.get("userId"));

  return c.json(await controller.delete(id, input.edit_scope), 200);
});

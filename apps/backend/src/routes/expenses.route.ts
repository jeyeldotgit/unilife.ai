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
  category: expenseCategorySchema.optional(),
});
const createExpenseSchema = z
  .object({
    id: z.string().uuid(),
    budget_id: z.string().uuid().nullable().optional(),
    amount: z.number().positive(),
    category: expenseCategorySchema,
    description: z.string().trim().min(1).max(2000).optional(),
    spent_at: isoDateTimeSchema.optional(),
    created_at: isoDateTimeSchema,
    updated_at: isoDateTimeSchema,
  })
  .strict();

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

expensesRouter.delete("/:id", async (c) => {
  const { id } = parseParams(c, idParamsSchema);
  const controller = new ExpensesController(c.get("supabase"), c.get("userId"));

  return c.json(await controller.delete(id), 200);
});

import { Hono } from "hono";
import { z } from "zod";

import { BudgetsController } from "../controllers/budgets.controller.js";
import type { AppBindings } from "../lib/hono.js";
import { parseJsonBody, parseParams, parseQuery } from "../lib/validation.js";
import { requireAuth } from "../middleware/auth.js";

const budgetPeriodSchema = z.enum(["daily", "weekly", "biweekly", "monthly"]);
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
const listBudgetsQuerySchema = z.object({
  since: isoDateTimeSchema.optional(),
});
const createBudgetSchema = z
  .object({
    id: z.string().uuid(),
    amount: z.number().positive(),
    period: budgetPeriodSchema,
    start_date: isoDateSchema,
    end_date: isoDateSchema,
    created_at: isoDateTimeSchema,
    updated_at: isoDateTimeSchema,
  })
  .strict();
const updateBudgetSchema = z
  .object({
    amount: z.number().positive().optional(),
    period: budgetPeriodSchema.optional(),
    start_date: isoDateSchema.optional(),
    end_date: isoDateSchema.optional(),
    updated_at: isoDateTimeSchema,
    mutation_id: z.string().uuid(),
  })
  .strict();

export const budgetsRouter = new Hono<AppBindings>();

budgetsRouter.use("*", requireAuth);

budgetsRouter.get("/", async (c) => {
  const input = parseQuery(c, listBudgetsQuerySchema);
  const controller = new BudgetsController(c.get("supabase"), c.get("userId"));

  return c.json(await controller.list(input), 200);
});

budgetsRouter.post("/", async (c) => {
  const input = await parseJsonBody(c, createBudgetSchema);
  const controller = new BudgetsController(c.get("supabase"), c.get("userId"));

  return c.json(await controller.create(input), 201);
});

budgetsRouter.patch("/:id", async (c) => {
  const { id } = parseParams(c, idParamsSchema);
  const input = await parseJsonBody(c, updateBudgetSchema);
  const controller = new BudgetsController(c.get("supabase"), c.get("userId"));

  return c.json(await controller.update(id, input), 200);
});

budgetsRouter.get("/revisions", async (c) => {
  const input = parseQuery(c, listBudgetsQuerySchema);
  const controller = new BudgetsController(c.get("supabase"), c.get("userId"));
  return c.json(await controller.listAllRevisions(input.since), 200);
});

budgetsRouter.get("/:id/revisions", async (c) => {
  const { id } = parseParams(c, idParamsSchema);
  const controller = new BudgetsController(c.get("supabase"), c.get("userId"));

  return c.json(await controller.listRevisions(id), 200);
});

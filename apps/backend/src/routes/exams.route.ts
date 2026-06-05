import { Hono } from "hono";
import { z } from "zod";

import { ExamsController } from "../controllers/exams.controller.js";
import type { AppBindings } from "../lib/hono.js";
import { parseJsonBody, parseParams, parseQuery } from "../lib/validation.js";
import { requireAuth } from "../middleware/auth.js";

const isoDateTimeSchema = z
  .string()
  .refine((value) => !Number.isNaN(Date.parse(value)), {
    message: "Invalid ISO datetime.",
  });
const idParamsSchema = z.object({
  id: z.string().uuid(),
});
const listExamsQuerySchema = z.object({
  since: isoDateTimeSchema.optional(),
});
const createExamSchema = z
  .object({
    id: z.string().uuid(),
    title: z.string().trim().min(1).max(255),
    exam_date: isoDateTimeSchema,
    class_id: z.string().uuid().nullable().optional(),
    description: z.string().trim().min(1).max(2000).optional(),
    location: z.string().trim().min(1).max(255).optional(),
    created_at: isoDateTimeSchema,
    updated_at: isoDateTimeSchema,
  })
  .strict();
const updateExamSchema = z
  .object({
    title: z.string().trim().min(1).max(255).optional(),
    exam_date: isoDateTimeSchema.optional(),
    class_id: z.string().uuid().nullable().optional(),
    description: z.string().trim().min(1).max(2000).nullable().optional(),
    location: z.string().trim().min(1).max(255).nullable().optional(),
    updated_at: isoDateTimeSchema,
  })
  .strict();

export const examsRouter = new Hono<AppBindings>();

examsRouter.use("*", requireAuth);

examsRouter.get("/", async (c) => {
  const input = parseQuery(c, listExamsQuerySchema);
  const controller = new ExamsController(c.get("supabase"), c.get("userId"));

  return c.json(await controller.list(input), 200);
});

examsRouter.get("/:id", async (c) => {
  const { id } = parseParams(c, idParamsSchema);
  const controller = new ExamsController(c.get("supabase"), c.get("userId"));

  return c.json(await controller.get(id), 200);
});

examsRouter.post("/", async (c) => {
  const input = await parseJsonBody(c, createExamSchema);
  const controller = new ExamsController(c.get("supabase"), c.get("userId"));

  return c.json(await controller.create(input), 201);
});

examsRouter.patch("/:id", async (c) => {
  const { id } = parseParams(c, idParamsSchema);
  const input = await parseJsonBody(c, updateExamSchema);
  const controller = new ExamsController(c.get("supabase"), c.get("userId"));

  return c.json(await controller.update(id, input), 200);
});

examsRouter.delete("/:id", async (c) => {
  const { id } = parseParams(c, idParamsSchema);
  const controller = new ExamsController(c.get("supabase"), c.get("userId"));

  return c.json(await controller.delete(id), 200);
});

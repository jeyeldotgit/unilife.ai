import { Hono } from "hono";
import { z } from "zod";

import { StudyKitsController } from "../controllers/study-kits.controller.js";
import type { AppBindings } from "../lib/hono.js";
import { parseJsonBody, parseParams, parseQuery } from "../lib/validation.js";
import { requireAuth } from "../middleware/auth.js";

const idParamsSchema = z.object({
  id: z.string().uuid(),
});
const createStudyKitSchema = z
  .object({
    source_name: z.string().trim().min(1).max(255),
    source_path: z.string().trim().min(1).max(1024),
    generation_count: z.union([z.literal(5), z.literal(10), z.literal(20), z.literal(30)]).optional(),
    class_id: z.string().uuid().nullable().optional(),
    exam_id: z.string().uuid().nullable().optional(),
    title: z.string().trim().min(1).max(255).nullable().optional(),
  })
  .strict();
const quizAttemptSchema = z
  .object({
    answers: z.record(z.string(), z.string()),
    score: z.number().int().min(0),
    total: z.number().int().min(1),
  })
  .strict();
const cardReviewSchema = z
  .object({
    flashcard_id: z.string().uuid(),
    state: z.enum(["seen", "known", "needs_review"]),
  })
  .strict();
const exportQuerySchema = z.object({
  format: z.enum(["csv", "json"]).default("json"),
});

export const studyKitsRouter = new Hono<AppBindings>();

studyKitsRouter.use("*", requireAuth);

studyKitsRouter.post("/", async (c) => {
  const input = await parseJsonBody(c, createStudyKitSchema);
  const controller = new StudyKitsController(c.get("supabase"), c.get("userId"));

  return c.json(await controller.create(input), 201);
});

studyKitsRouter.get("/", async (c) => {
  const controller = new StudyKitsController(c.get("supabase"), c.get("userId"));

  return c.json(await controller.list(), 200);
});

studyKitsRouter.get("/:id", async (c) => {
  const { id } = parseParams(c, idParamsSchema);
  const controller = new StudyKitsController(c.get("supabase"), c.get("userId"));

  return c.json(await controller.get(id), 200);
});

studyKitsRouter.delete("/:id", async (c) => {
  const { id } = parseParams(c, idParamsSchema);
  const controller = new StudyKitsController(c.get("supabase"), c.get("userId"));

  return c.json(await controller.delete(id), 200);
});

studyKitsRouter.post("/:id/quiz-attempts", async (c) => {
  const { id } = parseParams(c, idParamsSchema);
  const input = await parseJsonBody(c, quizAttemptSchema);
  const controller = new StudyKitsController(c.get("supabase"), c.get("userId"));

  return c.json(await controller.createQuizAttempt(id, input), 201);
});

studyKitsRouter.post("/:id/card-reviews", async (c) => {
  const { id } = parseParams(c, idParamsSchema);
  const input = await parseJsonBody(c, cardReviewSchema);
  const controller = new StudyKitsController(c.get("supabase"), c.get("userId"));

  return c.json(await controller.saveCardReview(id, input), 200);
});

studyKitsRouter.get("/:id/export", async (c) => {
  const { id } = parseParams(c, idParamsSchema);
  const { format } = parseQuery(c, exportQuerySchema);
  const controller = new StudyKitsController(c.get("supabase"), c.get("userId"));
  const body = await controller.export(id, format);

  c.header("Content-Disposition", `attachment; filename="study-kit.${format}"`);
  c.header("Content-Type", format === "csv" ? "text/csv; charset=utf-8" : "application/json");
  return c.body(body, 200);
});

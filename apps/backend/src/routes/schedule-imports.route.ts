import { Hono } from "hono";
import { z } from "zod";

import { ScheduleImportsController } from "../controllers/schedule-imports.controller.js";
import type { AppBindings } from "../lib/hono.js";
import { parseJsonBody, parseParams } from "../lib/validation.js";
import { requireAuth } from "../middleware/auth.js";

const sourceTypeSchema = z.enum(["image", "pdf", "ics"]);
const dayOfWeekSchema = z.enum([
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
]);
const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const idParamsSchema = z.object({
  id: z.string().uuid(),
});
const scheduleImportEntrySchema = z
  .object({
    id: z.string(),
    selected: z.boolean(),
    subject: z.string().nullable(),
    room: z.string().nullable(),
    instructor: z.string().nullable(),
    recurrence: z.record(z.string(), z.unknown()).nullable(),
    day_of_week: dayOfWeekSchema.nullable(),
    start_time: timeSchema.nullable(),
    end_time: timeSchema.nullable(),
    confidence: z.number().nullable(),
    uncertain_fields: z.array(z.string()),
    duplicate_candidates: z.array(z.string()),
    conflict_candidates: z.array(z.string()),
    course_code: z.string().nullable().optional(),
    section: z.string().nullable().optional(),
    source_row: z.string().nullable().optional(),
    parse_warnings: z.array(z.string()).optional(),
  })
  .strict();
const createScheduleImportSchema = z
  .object({
    source_type: sourceTypeSchema,
    source_name: z.string().trim().min(1).max(255),
    timezone: z.string().trim().min(1).max(255),
    content_base64: z.string().trim().min(1),
    term_id: z.string().uuid().nullable().optional(),
    source_path: z.string().trim().min(1).max(1024).nullable().optional(),
  })
  .strict();
const confirmScheduleImportSchema = z
  .object({
    entries: z.array(scheduleImportEntrySchema).min(1),
  })
  .strict();

export const scheduleImportsRouter = new Hono<AppBindings>();

scheduleImportsRouter.use("*", requireAuth);

scheduleImportsRouter.post("/", async (c) => {
  const input = await parseJsonBody(c, createScheduleImportSchema);
  const controller = new ScheduleImportsController(c.get("supabase"), c.get("userId"));

  return c.json(await controller.create(input), 201);
});

scheduleImportsRouter.get("/:id", async (c) => {
  const { id } = parseParams(c, idParamsSchema);
  const controller = new ScheduleImportsController(c.get("supabase"), c.get("userId"));

  return c.json(await controller.get(id), 200);
});

scheduleImportsRouter.post("/:id/confirm", async (c) => {
  const { id } = parseParams(c, idParamsSchema);
  const input = await parseJsonBody(c, confirmScheduleImportSchema);
  const controller = new ScheduleImportsController(c.get("supabase"), c.get("userId"));

  return c.json(await controller.confirm(id, input), 200);
});

scheduleImportsRouter.delete("/:id/source", async (c) => {
  const { id } = parseParams(c, idParamsSchema);
  const controller = new ScheduleImportsController(c.get("supabase"), c.get("userId"));

  return c.json(await controller.deleteSource(id), 200);
});

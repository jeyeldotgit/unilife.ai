import { Hono } from "hono";
import { z } from "zod";

import { ClassesController } from "../controllers/classes.controller.js";
import type { AppBindings } from "../lib/hono.js";
import { requireAuth } from "../middleware/auth.js";
import { parseJsonBody, parseParams, parseQuery } from "../lib/validation.js";

const dayOfWeekSchema = z.enum([
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
]);
const isoDateTimeSchema = z
  .string()
  .refine((value) => !Number.isNaN(Date.parse(value)), {
    message: "Invalid ISO datetime.",
  });
const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const recurrenceSchema = z
  .object({
    series_id: z.string().uuid().nullable(),
    occurrence_id: z.string().uuid().nullable(),
    original_start_at: isoDateTimeSchema.nullable(),
    effective_start_at: isoDateTimeSchema.nullable(),
    effective_end_at: isoDateTimeSchema.nullable(),
    source_revision: z.number().int().nullable(),
    timezone: z.string().trim().min(1).max(255).nullable(),
    rule: z
      .object({
        frequency: z.enum(["daily", "weekly"]),
        interval: z.number().int().min(1),
        weekdays: z.array(dayOfWeekSchema),
        timezone: z.string().trim().min(1).max(255),
        starts_at: isoDateTimeSchema,
        ends_at: isoDateTimeSchema.nullable(),
      })
      .nullable(),
    edit_scope: z.enum(["occurrence", "future", "series"]).optional(),
  })
  .strict();
const idParamsSchema = z.object({
  id: z.string().uuid(),
});
const listClassesQuerySchema = z.object({
  since: isoDateTimeSchema.optional(),
});
const createClassSchema = z
  .object({
    id: z.string().uuid(),
    term_id: z.string().uuid().nullable().optional(),
    subject: z.string().trim().min(1).max(255),
    room: z.string().trim().min(1).max(255).optional(),
    instructor: z.string().trim().min(1).max(255).optional(),
    day_of_week: dayOfWeekSchema,
    start_time: timeSchema,
    end_time: timeSchema,
    color: z.string().trim().min(1).max(64).optional(),
    recurrence: recurrenceSchema.nullable().optional(),
    created_at: isoDateTimeSchema,
    updated_at: isoDateTimeSchema,
  })
  .strict();
const updateClassSchema = z
  .object({
    subject: z.string().trim().min(1).max(255).optional(),
    term_id: z.string().uuid().nullable().optional(),
    room: z.string().trim().min(1).max(255).optional(),
    instructor: z.string().trim().min(1).max(255).optional(),
    day_of_week: dayOfWeekSchema.optional(),
    start_time: timeSchema.optional(),
    end_time: timeSchema.optional(),
    color: z.string().trim().min(1).max(64).optional(),
    is_active: z.boolean().optional(),
    recurrence: recurrenceSchema.nullable().optional(),
    edit_scope: z.enum(["occurrence", "future", "series"]).optional(),
    updated_at: isoDateTimeSchema,
  })
  .strict();

export const classesRouter = new Hono<AppBindings>();

classesRouter.use("*", requireAuth);

classesRouter.get("/", async (c) => {
  const input = parseQuery(c, listClassesQuerySchema);
  const controller = new ClassesController(c.get("supabase"), c.get("userId"));

  return c.json(await controller.list(input), 200);
});

classesRouter.get("/:id", async (c) => {
  const { id } = parseParams(c, idParamsSchema);
  const controller = new ClassesController(c.get("supabase"), c.get("userId"));

  return c.json(await controller.get(id), 200);
});

classesRouter.post("/", async (c) => {
  const input = await parseJsonBody(c, createClassSchema);
  const controller = new ClassesController(c.get("supabase"), c.get("userId"));

  return c.json(await controller.create(input), 201);
});

classesRouter.patch("/:id", async (c) => {
  const { id } = parseParams(c, idParamsSchema);
  const input = await parseJsonBody(c, updateClassSchema);
  const controller = new ClassesController(c.get("supabase"), c.get("userId"));

  return c.json(await controller.update(id, input), 200);
});

classesRouter.delete("/:id", async (c) => {
  const { id } = parseParams(c, idParamsSchema);
  const controller = new ClassesController(c.get("supabase"), c.get("userId"));

  return c.json(await controller.delete(id), 200);
});

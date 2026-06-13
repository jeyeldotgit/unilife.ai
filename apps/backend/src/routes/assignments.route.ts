import { Hono } from "hono";
import { z } from "zod";

import { AssignmentsController } from "../controllers/assignments.controller.js";
import type { AppBindings } from "../lib/hono.js";
import { parseJsonBody, parseParams, parseQuery } from "../lib/validation.js";
import { requireAuth } from "../middleware/auth.js";

const assignmentStatusSchema = z.enum(["pending", "in_progress", "completed"]);
const isoDateTimeSchema = z
  .string()
  .refine((value) => !Number.isNaN(Date.parse(value)), {
    message: "Invalid ISO datetime.",
  });
const idParamsSchema = z.object({
  id: z.string().uuid(),
});
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
        weekdays: z.array(
          z.enum([
            "monday",
            "tuesday",
            "wednesday",
            "thursday",
            "friday",
            "saturday",
            "sunday",
          ]),
        ),
        timezone: z.string().trim().min(1).max(255),
        starts_at: isoDateTimeSchema,
        ends_at: isoDateTimeSchema.nullable(),
      })
      .nullable(),
    edit_scope: z.enum(["occurrence", "future", "series"]).optional(),
  })
  .strict();
const listAssignmentsQuerySchema = z.object({
  since: isoDateTimeSchema.optional(),
  status: assignmentStatusSchema.optional(),
});
const createAssignmentSchema = z
  .object({
    id: z.string().uuid(),
    title: z.string().trim().min(1).max(255),
    due_date: isoDateTimeSchema,
    class_id: z.string().uuid().nullable().optional(),
    description: z.string().trim().min(1).max(2000).optional(),
    priority: z.number().int().min(1).max(3).optional(),
    status: assignmentStatusSchema.optional(),
    recurrence: recurrenceSchema.nullable().optional(),
    created_at: isoDateTimeSchema,
    updated_at: isoDateTimeSchema,
  })
  .strict();
const updateAssignmentSchema = z
  .object({
    title: z.string().trim().min(1).max(255).optional(),
    due_date: isoDateTimeSchema.optional(),
    class_id: z.string().uuid().nullable().optional(),
    description: z.string().trim().min(1).max(2000).nullable().optional(),
    status: assignmentStatusSchema.optional(),
    priority: z.number().int().min(1).max(3).optional(),
    recurrence: recurrenceSchema.nullable().optional(),
    edit_scope: z.enum(["occurrence", "future", "series"]).optional(),
    updated_at: isoDateTimeSchema,
  })
  .strict();

export const assignmentsRouter = new Hono<AppBindings>();

assignmentsRouter.use("*", requireAuth);

assignmentsRouter.get("/", async (c) => {
  const input = parseQuery(c, listAssignmentsQuerySchema);
  const controller = new AssignmentsController(c.get("supabase"), c.get("userId"));

  return c.json(await controller.list(input), 200);
});

assignmentsRouter.get("/:id", async (c) => {
  const { id } = parseParams(c, idParamsSchema);
  const controller = new AssignmentsController(c.get("supabase"), c.get("userId"));

  return c.json(await controller.get(id), 200);
});

assignmentsRouter.post("/", async (c) => {
  const input = await parseJsonBody(c, createAssignmentSchema);
  const controller = new AssignmentsController(c.get("supabase"), c.get("userId"));

  return c.json(await controller.create(input), 201);
});

assignmentsRouter.patch("/:id", async (c) => {
  const { id } = parseParams(c, idParamsSchema);
  const input = await parseJsonBody(c, updateAssignmentSchema);
  const controller = new AssignmentsController(c.get("supabase"), c.get("userId"));

  return c.json(await controller.update(id, input), 200);
});

assignmentsRouter.delete("/:id", async (c) => {
  const { id } = parseParams(c, idParamsSchema);
  const controller = new AssignmentsController(c.get("supabase"), c.get("userId"));

  return c.json(await controller.delete(id), 200);
});

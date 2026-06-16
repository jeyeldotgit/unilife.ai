import { Hono } from "hono";
import { z } from "zod";

import { NotificationPreferencesController } from "../controllers/notification-preferences.controller.js";
import type { AppBindings } from "../lib/hono.js";
import { parseJsonBody } from "../lib/validation.js";
import { requireAuth } from "../middleware/auth.js";

const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const preferenceSchema = z.object({
  category: z.enum(["class", "assignment", "exam", "budget_alert", "daily_briefing"]),
  enabled: z.boolean(),
  urgent_bypass_enabled: z.boolean(),
  escalation_limit: z.number().int().min(0).max(3),
}).strict();
const updateSchema = z.object({
  quiet_hours_enabled: z.boolean().optional(),
  quiet_hours_start: timeSchema.optional(),
  quiet_hours_end: timeSchema.optional(),
  preferences: z.array(preferenceSchema).optional(),
}).strict().refine((value) => Object.keys(value).length > 0, {
  message: "At least one notification preference field must be provided.",
});

export const notificationPreferencesRouter = new Hono<AppBindings>();
notificationPreferencesRouter.use("*", requireAuth);

notificationPreferencesRouter.get("/", async (c) => {
  const controller = new NotificationPreferencesController(c.get("supabase"), c.get("userId"));
  return c.json(await controller.get(), 200);
});

notificationPreferencesRouter.patch("/", async (c) => {
  const input = await parseJsonBody(c, updateSchema);
  const controller = new NotificationPreferencesController(c.get("supabase"), c.get("userId"));
  return c.json(await controller.update(input), 200);
});

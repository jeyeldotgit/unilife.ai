import { Hono } from "hono";
import { z } from "zod";

import type { AppBindings } from "../lib/hono.js";
import { parseQuery } from "../lib/validation.js";
import { requireAuth } from "../middleware/auth.js";
import { RecurrenceRepository } from "../repositories/recurrence.repository.js";

const querySchema = z.object({
  since: z.string().refine((value) => !Number.isNaN(Date.parse(value))).optional(),
});

export const recurrenceRouter = new Hono<AppBindings>();
recurrenceRouter.use("*", requireAuth);

recurrenceRouter.get("/series", async (c) => {
  const { since } = parseQuery(c, querySchema);
  const records = await new RecurrenceRepository(c.get("supabase")).listForUser("recurrence_series", c.get("userId"), since);
  return c.json({ recurrence_series: records }, 200);
});
recurrenceRouter.get("/occurrences", async (c) => {
  const { since } = parseQuery(c, querySchema);
  const records = await new RecurrenceRepository(c.get("supabase")).listForUser("recurrence_occurrence", c.get("userId"), since);
  return c.json({ recurrence_occurrences: records }, 200);
});
recurrenceRouter.get("/exceptions", async (c) => {
  const { since } = parseQuery(c, querySchema);
  const records = await new RecurrenceRepository(c.get("supabase")).listForUser("recurrence_exception", c.get("userId"), since);
  return c.json({ recurrence_exceptions: records }, 200);
});

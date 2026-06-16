import { Hono } from "hono";
import { z } from "zod";

import { AcademicTermsController } from "../controllers/academic-terms.controller.js";
import type { AppBindings } from "../lib/hono.js";
import { parseJsonBody, parseQuery } from "../lib/validation.js";
import { requireAuth } from "../middleware/auth.js";

const isoDateTimeSchema = z.string().refine((value) => !Number.isNaN(Date.parse(value)));
const academicTermsQuerySchema = z.object({
  since: isoDateTimeSchema.optional(),
});
const upsertAcademicTermSchema = z
  .object({
    id: z.string().uuid(),
    name: z.string().trim().min(1).max(255),
    status: z.enum(["active", "archived"]),
    created_at: isoDateTimeSchema,
    updated_at: isoDateTimeSchema,
    archived_at: isoDateTimeSchema.nullable(),
    deleted_at: isoDateTimeSchema.nullable(),
  })
  .strict();

export const academicTermsRouter = new Hono<AppBindings>();

academicTermsRouter.use("*", requireAuth);

academicTermsRouter.get("/", async (c) => {
  const filters = parseQuery(c, academicTermsQuerySchema);
  const controller = new AcademicTermsController(c.get("supabase"), c.get("userId"));

  return c.json(await controller.list(filters), 200);
});

academicTermsRouter.post("/", async (c) => {
  const input = await parseJsonBody(c, upsertAcademicTermSchema);
  const controller = new AcademicTermsController(c.get("supabase"), c.get("userId"));

  return c.json(await controller.upsert(input), 200);
});

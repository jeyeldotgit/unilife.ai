import { Hono } from "hono";
import { z } from "zod";

import { SyncController } from "../controllers/sync.controller.js";
import type { AppBindings } from "../lib/hono.js";
import { parseJsonBody } from "../lib/validation.js";
import { requireAuth } from "../middleware/auth.js";

const syncPushSchema = z
  .object({
    items: z.array(
      z
        .object({
          id: z.string().uuid(),
          entity_type: z.enum([
            "class",
            "assignment",
            "exam",
            "expense",
            "budget",
            "recurrence_series",
            "recurrence_occurrence",
            "recurrence_exception",
            "ai_action",
          ]),
          entity_id: z.string().uuid(),
          operation: z.enum(["create", "update", "delete"]),
          payload: z.record(z.string(), z.unknown()),
        })
        .strict(),
    ),
  })
  .strict();

export const syncRouter = new Hono<AppBindings>();

syncRouter.use("*", requireAuth);

syncRouter.post("/push", async (c) => {
  const input = await parseJsonBody(c, syncPushSchema);
  const controller = new SyncController(c.get("supabase"), c.get("userId"));

  return c.json(await controller.push(input.items), 200);
});

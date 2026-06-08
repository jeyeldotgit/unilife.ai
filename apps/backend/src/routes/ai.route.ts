import { Hono } from "hono";
import { z } from "zod";

import { AIController } from "../controllers/ai.controller.js";
import type { AppBindings } from "../lib/hono.js";
import { parseJsonBody } from "../lib/validation.js";
import { requireAuth } from "../middleware/auth.js";

const aiChatRequestSchema = z
  .object({
    message: z.string().trim().min(1).max(1000),
    context: z
      .object({
        today: z.string(),
        current_time: z.string(),
        todays_classes: z.array(
          z
            .object({
              subject: z.string(),
              start_time: z.string(),
              end_time: z.string(),
            })
            .strict(),
        ),
        upcoming_deadlines: z.array(
          z
            .object({
              title: z.string(),
              due_date: z.string(),
              type: z.enum(["assignment", "exam"]),
              status: z.enum(["pending", "in_progress"]),
            })
            .strict(),
        ),
        budget_remaining: z.number().nullable(),
        budget_period_end_date: z.string().nullable(),
        avg_daily_spend: z.number().nullable(),
      })
      .strict(),
  })
  .strict();

export const aiRouter = new Hono<AppBindings>();

aiRouter.use("*", requireAuth);

aiRouter.post("/chat", async (c) => {
  const input = await parseJsonBody(c, aiChatRequestSchema);
  const controller = new AIController(c.get("supabase"), c.get("userId"));

  return c.json(await controller.chat(input), 200);
});

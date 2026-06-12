import { Hono } from "hono";
import { z } from "zod";

import { ProfileController } from "../controllers/profile.controller.js";
import type { AppBindings } from "../lib/hono.js";
import { validationError } from "../lib/http-errors.js";
import { parseJsonBody } from "../lib/validation.js";
import { requireAuth } from "../middleware/auth.js";
import { isValidTimeZone } from "../services/profile.service.js";

const avatarUrlSchema = z.string().trim().max(2048).refine(
  (value) => value.startsWith("/") || z.url().safeParse(value).success,
  {
    message: "Avatar URLs must be absolute or app-relative.",
  },
);

const timeZoneSchema = z
  .string()
  .trim()
  .min(1)
  .refine((value) => isValidTimeZone(value), {
    message: "Invalid IANA timezone identifier.",
  });

const updateProfileSchema = z
  .object({
    display_name: z.string().trim().max(255).nullable().optional(),
    avatar_url: avatarUrlSchema.nullable().optional(),
    timezone: timeZoneSchema.nullable().optional(),
  })
  .strict()
  .refine(
    (value) =>
      value.display_name !== undefined ||
      value.avatar_url !== undefined ||
      value.timezone !== undefined,
    {
      message: "At least one profile field must be provided.",
    },
  );

export const profileRouter = new Hono<AppBindings>();

profileRouter.use("*", requireAuth);

profileRouter.get("/", async (c) => {
  const controller = new ProfileController(c.get("supabase"), c.get("userId"));

  return c.json(await controller.get(), 200);
});

profileRouter.patch("/", async (c) => {
  const input = await parseJsonBody(c, updateProfileSchema).catch((error) => {
    if (
      error instanceof z.ZodError &&
      error.issues.some((issue) => issue.message === "Invalid IANA timezone identifier.")
    ) {
      throw validationError("Invalid IANA timezone identifier.", error.flatten());
    }

    throw error;
  });
  const controller = new ProfileController(c.get("supabase"), c.get("userId"));

  return c.json(await controller.update(input), 200);
});

import type { MiddlewareHandler } from "hono";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { AppBindings } from "../lib/hono.js";
import { unauthenticated } from "../lib/http-errors.js";
import { createSupabaseClient } from "../lib/supabase.js";

export type GetSupabaseClient = () => SupabaseClient;

function extractBearerToken(headerValue?: string | null) {
  if (!headerValue) {
    return null;
  }

  const match = headerValue.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

export function createRequireAuth(
  getSupabaseClient: GetSupabaseClient = createSupabaseClient,
): MiddlewareHandler<AppBindings> {
  return async (c, next) => {
    const token = extractBearerToken(c.req.header("Authorization"));

    if (!token) {
      throw unauthenticated("Missing bearer token.");
    }

    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user?.id) {
      throw unauthenticated("Invalid or expired bearer token.");
    }

    c.set("supabase", supabase);
    c.set("userId", data.user.id);

    await next();
  };
}

export const requireAuth = createRequireAuth();

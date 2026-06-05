import { Hono } from "hono";
import { describe, expect, it, vi } from "vitest";

import { handleHttpError } from "../src/lib/http-errors.js";
import type { AppBindings } from "../src/lib/hono.js";
import { createRequireAuth } from "../src/middleware/auth.js";

function createMockSupabase(result: unknown) {
  const getUser = vi.fn().mockResolvedValue(result);
  const supabase = {
    auth: {
      getUser,
    },
  };

  return {
    getUser,
    supabase,
  };
}

function createProtectedApp(result: unknown) {
  const { getUser, supabase } = createMockSupabase(result);
  const app = new Hono<AppBindings>();

  app.onError(handleHttpError);
  app.use("/protected", createRequireAuth(() => supabase as never));
  app.get("/protected", (c) =>
    c.json({
      hasSupabase: c.get("supabase") === supabase,
      userId: c.get("userId"),
    }),
  );

  return {
    app,
    getUser,
    supabase,
  };
}

describe("auth middleware", () => {
  it("returns 401 when the bearer token is missing", async () => {
    const { app, getUser } = createProtectedApp({
      data: { user: { id: "user-123" } },
      error: null,
    });

    const response = await app.request("http://localhost/protected");
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({
      error: {
        code: "UNAUTHENTICATED",
        message: "Missing bearer token.",
      },
    });
    expect(getUser).not.toHaveBeenCalled();
  });

  it("returns 401 for malformed authorization headers", async () => {
    const { app, getUser } = createProtectedApp({
      data: { user: { id: "user-123" } },
      error: null,
    });

    const response = await app.request("http://localhost/protected", {
      headers: {
        Authorization: "Token nope",
      },
    });
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error.code).toBe("UNAUTHENTICATED");
    expect(body.error.message).toBe("Missing bearer token.");
    expect(getUser).not.toHaveBeenCalled();
  });

  it("returns 401 for invalid or expired tokens", async () => {
    const { app, getUser } = createProtectedApp({
      data: { user: null },
      error: {
        message: "JWT expired",
      },
    });

    const response = await app.request("http://localhost/protected", {
      headers: {
        Authorization: "Bearer expired-token",
      },
    });
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({
      error: {
        code: "UNAUTHENTICATED",
        message: "Invalid or expired bearer token.",
      },
    });
    expect(getUser).toHaveBeenCalledWith("expired-token");
  });

  it("injects userId and supabase for valid tokens", async () => {
    const { app } = createProtectedApp({
      data: { user: { id: "user-123" } },
      error: null,
    });

    const response = await app.request("http://localhost/protected", {
      headers: {
        Authorization: "Bearer valid-token",
      },
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      hasSupabase: true,
      userId: "user-123",
    });
  });
});

import { Hono } from "hono";
import { z } from "zod";
import { describe, expect, it } from "vitest";

import {
  conflict,
  forbidden,
  handleHttpError,
  notFound,
} from "../src/lib/http-errors.js";

function createErrorApp() {
  const app = new Hono();

  app.onError(handleHttpError);
  app.get("/validation", () => {
    z.object({
      id: z.string().uuid(),
    }).parse({ id: "not-a-uuid" });

    return new Response("ok");
  });
  app.get("/forbidden", () => {
    throw forbidden("Nope.");
  });
  app.get("/not-found", () => {
    throw notFound("Missing.");
  });
  app.get("/conflict", () => {
    throw conflict("Already exists.");
  });
  app.get("/unknown", () => {
    throw new Error("boom");
  });

  return app;
}

describe("handleHttpError", () => {
  it("maps zod errors to VALIDATION_ERROR", async () => {
    const app = createErrorApp();

    const response = await app.request("http://localhost/validation");
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(body.error.details).toBeDefined();
  });

  it("preserves explicit http errors", async () => {
    const app = createErrorApp();

    const forbiddenResponse = await app.request("http://localhost/forbidden");
    const forbiddenBody = await forbiddenResponse.json();
    const notFoundResponse = await app.request("http://localhost/not-found");
    const notFoundBody = await notFoundResponse.json();
    const conflictResponse = await app.request("http://localhost/conflict");
    const conflictBody = await conflictResponse.json();

    expect(forbiddenResponse.status).toBe(403);
    expect(forbiddenBody.error).toEqual({
      code: "FORBIDDEN",
      message: "Nope.",
    });
    expect(notFoundResponse.status).toBe(404);
    expect(notFoundBody.error).toEqual({
      code: "NOT_FOUND",
      message: "Missing.",
    });
    expect(conflictResponse.status).toBe(409);
    expect(conflictBody.error).toEqual({
      code: "CONFLICT",
      message: "Already exists.",
    });
  });

  it("maps unknown errors to INTERNAL_ERROR", async () => {
    const app = createErrorApp();

    const response = await app.request("http://localhost/unknown");
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toEqual({
      code: "INTERNAL_ERROR",
      message: "An unexpected error occurred.",
    });
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/repositories/health.repository.js", () => ({
  HealthRepository: class HealthRepository {
    async isDatabaseReachable() {
      return true;
    }
  },
}));

describe("GET /health", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("returns the public health payload", async () => {
    const { app } = await import("../src/app.js");

    const response = await app.request("http://localhost/health");
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.database).toBe("up");
    expect(new Date(body.timestamp).toISOString()).toBe(body.timestamp);
  });
});

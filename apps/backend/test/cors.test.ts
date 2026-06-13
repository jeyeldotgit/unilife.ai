import { describe, expect, it } from "vitest";

import { app } from "../src/app.js";

describe("CORS", () => {
  it("accepts preflight requests from the production frontend", async () => {
    const response = await app.request("http://localhost/api/ai/briefing", {
      method: "OPTIONS",
      headers: {
        Origin: "https://unilife-ai-frontend.vercel.app",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "authorization,content-type",
      },
    });

    expect(response.status).toBe(204);
    expect(response.headers.get("access-control-allow-origin")).toBe(
      "https://unilife-ai-frontend.vercel.app",
    );
    expect(response.headers.get("access-control-allow-credentials")).toBe("true");
  });

  it("does not allow unknown origins", async () => {
    const response = await app.request("http://localhost/api/ai/briefing", {
      method: "OPTIONS",
      headers: {
        Origin: "https://example.com",
        "Access-Control-Request-Method": "POST",
      },
    });

    expect(response.headers.get("access-control-allow-origin")).toBeNull();
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

const getSession = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getSession,
    },
  })),
}));

describe("api client", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_BACKEND_URL = "http://localhost:3001";
    vi.restoreAllMocks();
    getSession.mockReset();
    getSession.mockResolvedValue({
      data: {
        session: {
          access_token: "test-token",
        },
      },
    });
  });

  it("builds backend urls with query params", async () => {
    const { buildBackendUrl } = await import("@/lib/api/client");

    expect(
      buildBackendUrl("/api/expenses", {
        from: "2026-06-01",
        to: "2026-06-07",
      }),
    ).toBe("http://localhost:3001/api/expenses?from=2026-06-01&to=2026-06-07");
  });

  it("attaches the auth header when requesting the backend", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: {
          "content-type": "application/json",
        },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { requestBackend } = await import("@/lib/api/client");

    await requestBackend("/api/health");

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3001/api/health",
      expect.objectContaining({
        headers: expect.any(Headers),
      }),
    );
    const headers = fetchMock.mock.calls[0]?.[1]?.headers as Headers;
    expect(headers.get("Authorization")).toBe("Bearer test-token");
  });

  it("normalizes backend error payloads into BackendApiError", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          error: {
            code: "VALIDATION_ERROR",
            message: "Bad request.",
            details: {
              field: "title",
            },
          },
        }),
        {
          status: 400,
          headers: {
            "content-type": "application/json",
          },
        },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { BackendApiError, requestBackend } = await import("@/lib/api/client");

    await expect(requestBackend("/api/assignments")).rejects.toMatchObject({
      name: BackendApiError.name,
      status: 400,
      code: "VALIDATION_ERROR",
      details: {
        field: "title",
      },
      message: "Bad request.",
    });
  });
});

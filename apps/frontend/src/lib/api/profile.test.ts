import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requestBackend: vi.fn(),
}));

vi.mock("@/lib/api/client", () => ({
  requestBackend: mocks.requestBackend,
}));

describe("profile api", () => {
  beforeEach(() => {
    mocks.requestBackend.mockReset();
  });

  it("normalizes nullable profile fields", async () => {
    mocks.requestBackend.mockResolvedValue({
      profile: {
        id: "user-1",
        email: "student@example.com",
        display_name: null,
        avatar_url: undefined,
        timezone: undefined,
        created_at: "2026-06-01T00:00:00.000Z",
        updated_at: "2026-06-02T00:00:00.000Z",
      },
    });

    const { getProfile } = await import("@/lib/api/profile");
    const profile = await getProfile();

    expect(profile).toMatchObject({
      display_name: null,
      avatar_url: null,
      timezone: null,
    });
  });
});

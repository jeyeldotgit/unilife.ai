import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  profiles: [] as Record<string, unknown>[],
}));

vi.mock("../src/repositories/health.repository.js", () => ({
  HealthRepository: class HealthRepository {
    async isDatabaseReachable() {
      return true;
    }
  },
}));

vi.mock("../src/lib/supabase.js", () => ({
  createSupabaseClient: () => ({
    auth: {
      getUser: async (token: string) => {
        if (token === "valid-token") {
          return {
            data: { user: { id: "user-1" } },
            error: null,
          };
        }

        return {
          data: { user: null },
          error: { message: "Invalid token" },
        };
      },
    },
  }),
}));

vi.mock("../src/repositories/profile.repository.js", () => ({
  ProfileRepository: class ProfileRepository {
    async findById(userId: string) {
      return state.profiles.find((profile) => profile.id === userId) ?? null;
    }

    async updateById(userId: string, changes: Record<string, unknown>) {
      const index = state.profiles.findIndex((profile) => profile.id === userId);

      if (index === -1) {
        return null;
      }

      state.profiles[index] = {
        ...state.profiles[index],
        ...changes,
      };

      return state.profiles[index];
    }
  },
}));

import { app } from "../src/app.js";

beforeEach(() => {
  state.profiles = [
    {
      id: "user-1",
      email: "student@example.com",
      display_name: "Joy",
      avatar_url: null,
      timezone: null,
      created_at: "2026-06-01T08:00:00.000Z",
      updated_at: "2026-06-01T08:00:00.000Z",
    },
  ];
});

describe("profile endpoints", () => {
  it("rejects unauthenticated requests", async () => {
    const response = await app.request("http://localhost/api/profile");

    expect(response.status).toBe(401);
  });

  it("gets and updates the authenticated profile", async () => {
    const getResponse = await app.request("http://localhost/api/profile", {
      headers: {
        Authorization: "Bearer valid-token",
      },
    });
    const getBody = await getResponse.json();

    expect(getResponse.status).toBe(200);
    expect(getBody.profile).toMatchObject({
      id: "user-1",
      display_name: "Joy",
      timezone: null,
    });

    const patchResponse = await app.request("http://localhost/api/profile", {
      method: "PATCH",
      headers: {
        Authorization: "Bearer valid-token",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        display_name: "Joyce",
        avatar_url: "https://example.com/presets/avatar-01.svg",
        timezone: "Asia/Manila",
      }),
    });
    const patchBody = await patchResponse.json();

    expect(patchResponse.status).toBe(200);
    expect(patchBody.profile).toMatchObject({
      id: "user-1",
      display_name: "Joyce",
      avatar_url: "https://example.com/presets/avatar-01.svg",
      timezone: "Asia/Manila",
    });
  });

  it("supports nullable fields and rejects invalid timezones", async () => {
    const patchResponse = await app.request("http://localhost/api/profile", {
      method: "PATCH",
      headers: {
        Authorization: "Bearer valid-token",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        display_name: null,
        avatar_url: null,
        timezone: null,
      }),
    });
    const patchBody = await patchResponse.json();

    expect(patchResponse.status).toBe(200);
    expect(patchBody.profile).toMatchObject({
      display_name: null,
      avatar_url: null,
      timezone: null,
    });

    const invalidResponse = await app.request("http://localhost/api/profile", {
      method: "PATCH",
      headers: {
        Authorization: "Bearer valid-token",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        timezone: "Mars/Olympus",
      }),
    });
    const invalidBody = await invalidResponse.json();

    expect(invalidResponse.status).toBe(400);
    expect(invalidBody.error.code).toBe("VALIDATION_ERROR");
  });
});

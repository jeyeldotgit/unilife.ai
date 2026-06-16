import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  profiles: [] as Record<string, unknown>[],
  notificationPreferences: [] as Record<string, unknown>[],
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

vi.mock("../src/repositories/notification-preferences.repository.js", () => ({
  NotificationPreferencesRepository: class NotificationPreferencesRepository {
    async listForUser(userId: string) {
      return state.notificationPreferences.filter((item) => item.user_id === userId);
    }

    async upsertForUser(userId: string, preferences: Record<string, unknown>[]) {
      for (const preference of preferences) {
        const index = state.notificationPreferences.findIndex(
          (item) => item.user_id === userId && item.category === preference.category,
        );
        const next = { ...preference, user_id: userId };
        if (index === -1) state.notificationPreferences.push(next);
        else state.notificationPreferences[index] = next;
      }
      return preferences;
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
  state.notificationPreferences = [];
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

describe("notification preference endpoints", () => {
  it("rejects unauthenticated requests and returns authenticated defaults", async () => {
    expect((await app.request("http://localhost/api/notification-preferences")).status).toBe(401);

    const response = await app.request("http://localhost/api/notification-preferences", {
      headers: { Authorization: "Bearer valid-token" },
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.settings.preferences).toHaveLength(5);
    expect(body.settings).toMatchObject({
      user_id: "user-1",
      quiet_hours_enabled: true,
      quiet_hours_start: "22:00",
      quiet_hours_end: "07:00",
    });
  });

  it("validates and updates user-scoped preferences", async () => {
    const invalid = await app.request("http://localhost/api/notification-preferences", {
      method: "PATCH",
      headers: { Authorization: "Bearer valid-token", "Content-Type": "application/json" },
      body: JSON.stringify({ quiet_hours_start: "25:00" }),
    });
    expect(invalid.status).toBe(400);

    const response = await app.request("http://localhost/api/notification-preferences", {
      method: "PATCH",
      headers: { Authorization: "Bearer valid-token", "Content-Type": "application/json" },
      body: JSON.stringify({
        quiet_hours_enabled: false,
        preferences: [{
          category: "exam",
          enabled: false,
          urgent_bypass_enabled: false,
          escalation_limit: 0,
        }],
      }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.settings.quiet_hours_enabled).toBe(false);
    expect(body.settings.preferences.find((item: { category: string }) => item.category === "exam")).toMatchObject({
      category: "exam",
      enabled: false,
      urgent_bypass_enabled: false,
      escalation_limit: 0,
    });
  });
});

import { describe, expect, it, vi } from "vitest";

import {
  NotificationPreferencesService,
  defaultNotificationPreferences,
} from "../src/services/notification-preferences.service.js";

describe("notification preferences service", () => {
  it("returns defaults for every category and profile quiet hours", async () => {
    const service = new NotificationPreferencesService(
      {} as never,
      "user-1",
      { listForUser: vi.fn(async () => []), upsertForUser: vi.fn() } as never,
      {
        findById: vi.fn(async () => ({
          id: "user-1",
          email: "student@example.com",
          timezone: "Asia/Manila",
          quiet_hours_enabled: true,
          quiet_hours_start: "22:00",
          quiet_hours_end: "07:00",
          created_at: "2026-06-01T00:00:00.000Z",
          updated_at: "2026-06-01T00:00:00.000Z",
        })),
      } as never,
    );

    const settings = await service.getSettings();

    expect(settings.preferences).toEqual(defaultNotificationPreferences());
    expect(settings).toMatchObject({
      timezone: "Asia/Manila",
      quiet_hours_enabled: true,
      quiet_hours_start: "22:00",
      quiet_hours_end: "07:00",
    });
  });

  it("updates only the authenticated user's settings", async () => {
    const updateById = vi.fn();
    const upsertForUser = vi.fn();
    const service = new NotificationPreferencesService(
      {} as never,
      "user-1",
      { listForUser: vi.fn(async () => []), upsertForUser } as never,
      {
        findById: vi.fn(async () => null),
        updateById,
      } as never,
    );

    await service.updateSettings({
      quiet_hours_enabled: false,
      preferences: [{ category: "exam", enabled: false, urgent_bypass_enabled: false, escalation_limit: 0 }],
    });

    expect(updateById).toHaveBeenCalledWith("user-1", expect.objectContaining({
      quiet_hours_enabled: false,
    }));
    expect(upsertForUser).toHaveBeenCalledWith("user-1", [
      { category: "exam", enabled: false, urgent_bypass_enabled: false, escalation_limit: 0 },
    ]);
  });
});

import { describe, expect, it } from "vitest";

import {
  applyNotificationPreferences,
  mergeNotificationSchedules,
} from "@/lib/notifications/store";
import { createDefaultNotificationSettings } from "@/lib/notifications/preferences";

describe("notification reconciliation", () => {
  it("preserves lifecycle status for unchanged deterministic reminders", () => {
    const desired = {
      body: "Updated copy",
      created_at: "2026-06-12T00:00:00.000Z",
      entity_id: "assignment-1",
      entity_type: "assignment" as const,
      id: "assignment:assignment-1:2026-06-19T00:00:00.000Z",
      scheduled_at: "2026-06-19T00:00:00.000Z",
      status: "pending" as const,
      title: "Updated title",
      user_id: "user-1",
    };

    expect(
      mergeNotificationSchedules(
        [
          {
            ...desired,
            body: "Old copy",
            created_at: "2026-06-01T00:00:00.000Z",
            status: "sent",
          },
        ],
        [desired],
      ),
    ).toEqual([
      {
        ...desired,
        created_at: "2026-06-01T00:00:00.000Z",
        status: "sent",
      },
    ]);
  });

  it("drops obsolete reminders when the desired schedule changes", () => {
    const existing = {
      body: "Old",
      created_at: "2026-06-01T00:00:00.000Z",
      entity_id: "exam-1",
      entity_type: "exam" as const,
      id: "old-reminder",
      scheduled_at: "2026-06-15T00:00:00.000Z",
      status: "sent" as const,
      title: "Old",
      user_id: "user-1",
    };

    expect(mergeNotificationSchedules([existing], [])).toEqual([]);
  });

  it("keeps the closest reminders within the configured escalation limit", () => {
    const settings = createDefaultNotificationSettings("user-1");
    settings.preferences = settings.preferences.map((item) =>
      item.category === "assignment" ? { ...item, escalation_limit: 2 } : item,
    );
    const desired = [1, 2, 3, 4].map((day) => ({
      body: "Body",
      category: "assignment" as const,
      created_at: "2026-06-01T00:00:00.000Z",
      entity_id: "assignment-1",
      entity_type: "assignment" as const,
      id: `notification-${day}`,
      logical_item_id: "assignment-1",
      scheduled_at: `2026-06-0${day}T00:00:00.000Z`,
      status: "pending" as const,
      title: "Title",
      user_id: "user-1",
    }));

    expect(applyNotificationPreferences(desired, settings).map((item) => item.id)).toEqual([
      "notification-3",
      "notification-4",
    ]);

    settings.preferences = settings.preferences.map((item) =>
      item.category === "assignment" ? { ...item, escalation_limit: 0 } : item,
    );
    expect(applyNotificationPreferences(desired, settings)).toEqual([]);
  });
});


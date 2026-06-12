import { describe, expect, it } from "vitest";

import { mergeNotificationSchedules } from "@/lib/notifications/store";

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
});


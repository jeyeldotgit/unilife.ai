import { describe, expect, it } from "vitest";

import {
  buildAssignmentNotifications,
  buildClassNotifications,
  buildExamNotifications,
  computeNotificationSchedule,
  getClassOccurrences,
} from "@/lib/notifications/schedule";

const NOW = new Date("2026-06-12T00:00:00.000Z");

describe("notification schedules", () => {
  it("computes the documented assignment and exam offsets", () => {
    const target = new Date("2026-06-20T12:00:00.000Z");

    expect(
      computeNotificationSchedule("assignment", target).map((date) =>
        date.toISOString(),
      ),
    ).toEqual([
      "2026-06-13T12:00:00.000Z",
      "2026-06-17T12:00:00.000Z",
      "2026-06-19T12:00:00.000Z",
      "2026-06-20T09:00:00.000Z",
    ]);
    expect(computeNotificationSchedule("exam", target)[0].toISOString()).toBe(
      "2026-06-06T12:00:00.000Z",
    );
  });

  it("materializes recurring classes within a rolling 14-day horizon", () => {
    const record = {
      color: null,
      created_at: NOW.toISOString(),
      day_of_week: "monday" as const,
      deleted_at: null,
      end_time: "10:00",
      id: "class-1",
      instructor: null,
      is_active: true,
      recurrence: null,
      room: "101",
      start_time: "09:00",
      subject: "Math",
      updated_at: NOW.toISOString(),
      user_id: "user-1",
    };

    const occurrences = getClassOccurrences(record, NOW);
    expect(occurrences).toHaveLength(2);
    expect(occurrences.map((date) => [date.getDay(), date.getHours()])).toEqual([
      [1, 9],
      [1, 9],
    ]);
    const classReminder = new Date(buildClassNotifications(record, NOW)[0].scheduled_at);
    expect([classReminder.getHours(), classReminder.getMinutes()]).toEqual([8, 30]);
  });

  it("uses deterministic IDs and omits completed or expired entities", () => {
    const assignment = {
      class_id: null,
      created_at: NOW.toISOString(),
      deleted_at: null,
      description: null,
      due_date: "2026-06-20T12:00:00.000Z",
      id: "assignment-1",
      priority: 2,
      recurrence: null,
      status: "pending" as const,
      title: "Paper",
      updated_at: NOW.toISOString(),
      user_id: "user-1",
    };
    const first = buildAssignmentNotifications(assignment, NOW);
    const second = buildAssignmentNotifications(assignment, NOW);

    expect(first.map((item) => item.id)).toEqual(second.map((item) => item.id));
    expect(
      buildAssignmentNotifications({ ...assignment, status: "completed" }, NOW),
    ).toEqual([]);
    expect(
      buildExamNotifications(
        {
          class_id: null,
          created_at: NOW.toISOString(),
          deleted_at: null,
          description: null,
          exam_date: "2026-06-11T12:00:00.000Z",
          id: "exam-1",
          location: null,
          title: "Quiz",
          updated_at: NOW.toISOString(),
          user_id: "user-1",
        },
        NOW,
      ),
    ).toEqual([]);
  });

  it("materializes recurring assignments with deterministic IDs per due date", () => {
    const assignment = {
      class_id: null,
      created_at: NOW.toISOString(),
      deleted_at: null,
      description: null,
      due_date: "2026-06-12T12:00:00.000Z",
      id: "assignment-recurring",
      priority: 2,
      recurrence: {
        series_id: "series-1",
        occurrence_id: null,
        original_start_at: null,
        effective_start_at: null,
        effective_end_at: null,
        source_revision: 1,
        timezone: "UTC",
        rule: {
          ends_at: null,
          frequency: "daily" as const,
          interval: 1,
          starts_at: "2026-06-12T12:00:00.000Z",
          timezone: "UTC",
          weekdays: [],
        },
      },
      status: "pending" as const,
      title: "Daily Journal",
      updated_at: NOW.toISOString(),
      user_id: "user-1",
    };

    const notifications = buildAssignmentNotifications(assignment, NOW);

    expect(notifications.length).toBeGreaterThan(4);
    expect(new Set(notifications.map((item) => item.id)).size).toBe(notifications.length);
  });
});

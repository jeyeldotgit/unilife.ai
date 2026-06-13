import { describe, expect, it } from "vitest";

import { buildScheduleWeekSnapshot } from "@/lib/api/schedule";

describe("schedule adapter", () => {
  it("renders a seven-day week and links assignments to the logical class", () => {
    const schedule = buildScheduleWeekSnapshot(
      [
        {
          id: "class-1",
          user_id: "user-1",
          subject: "Math 101",
          room: "Room 3A",
          instructor: "Prof. Reyes",
          day_of_week: "monday",
          start_time: "08:00",
          end_time: "09:30",
          color: "blue",
          is_active: true,
          recurrence: null,
          created_at: "2026-06-01T00:00:00.000Z",
          updated_at: "2026-06-01T00:00:00.000Z",
          deleted_at: null,
        },
        {
          id: "class-2",
          user_id: "user-1",
          subject: "PE",
          room: "Gym",
          instructor: "Coach Dela Cruz",
          day_of_week: "saturday",
          start_time: "10:00",
          end_time: "11:00",
          color: "green",
          is_active: true,
          recurrence: null,
          created_at: "2026-06-01T00:00:00.000Z",
          updated_at: "2026-06-01T00:00:00.000Z",
          deleted_at: null,
        },
      ],
      [
        {
          id: "assignment-1",
          user_id: "user-1",
          class_id: "class-1",
          title: "Research Paper",
          description: null,
          due_date: "2099-06-05T23:59:00.000Z",
          status: "pending",
          priority: 3,
          recurrence: null,
          created_at: "2026-06-01T00:00:00.000Z",
          updated_at: "2026-06-01T00:00:00.000Z",
          deleted_at: null,
        },
      ],
    );

    expect(schedule.days).toHaveLength(7);
    expect(schedule.classDetails["class-1"]?.assignments[0]).toMatchObject({
      id: "assignment-1",
      title: "Research Paper",
      status: "pending",
    });
  });

  it("duplicates overnight classes onto the following day and exposes conflicts", () => {
    const schedule = buildScheduleWeekSnapshot([
      {
        id: "class-overnight",
        user_id: "user-1",
        subject: "Studio",
        room: "Lab 4",
        instructor: "Prof. Cruz",
        day_of_week: "friday",
        start_time: "23:00",
        end_time: "01:00",
        color: "amber",
        is_active: true,
        recurrence: null,
        created_at: "2026-06-01T00:00:00.000Z",
        updated_at: "2026-06-01T00:00:00.000Z",
        deleted_at: null,
      },
      {
        id: "class-overlap",
        user_id: "user-1",
        subject: "Review",
        room: "Room 2",
        instructor: "Prof. Lee",
        day_of_week: "saturday",
        start_time: "00:30",
        end_time: "02:00",
        color: "blue",
        is_active: true,
        recurrence: null,
        created_at: "2026-06-01T00:00:00.000Z",
        updated_at: "2026-06-01T00:00:00.000Z",
        deleted_at: null,
      },
    ], []);

    expect(schedule.classes.filter((item) => item.logicalId === "class-overnight")).toHaveLength(2);
    expect(schedule.classes.some((item) => item.dayOfWeek === "saturday" && item.logicalId === "class-overnight")).toBe(true);
    expect(schedule.conflicts?.length).toBeGreaterThan(0);
  });

  it("can hide empty days without changing the underlying class data", () => {
    const schedule = buildScheduleWeekSnapshot(
      [
        {
          id: "class-1",
          user_id: "user-1",
          subject: "Math 101",
          room: "Room 3A",
          instructor: "Prof. Reyes",
          day_of_week: "monday",
          start_time: "08:00",
          end_time: "09:30",
          color: "blue",
          is_active: true,
          recurrence: null,
          created_at: "2026-06-01T00:00:00.000Z",
          updated_at: "2026-06-01T00:00:00.000Z",
          deleted_at: null,
        },
      ],
      [],
      [],
      { hideEmptyDays: true },
    );

    expect(schedule.days).toHaveLength(1);
    expect(schedule.classes).toHaveLength(1);
  });

  it("renders hydrated database time values that include seconds", () => {
    const schedule = buildScheduleWeekSnapshot(
      [
        {
          id: "class-db-time",
          user_id: "user-1",
          subject: "Capstone",
          room: null,
          instructor: null,
          day_of_week: "tuesday",
          start_time: "09:00:00",
          end_time: "12:00:00",
          color: null,
          is_active: true,
          recurrence: null,
          created_at: "2026-06-01T00:00:00.000Z",
          updated_at: "2026-06-01T00:00:00.000Z",
          deleted_at: null,
        },
      ],
      [],
    );

    expect(schedule.classes[0]).toMatchObject({
      subject: "Capstone",
      startTime: "09:00",
      endTime: "12:00",
    });
  });
});

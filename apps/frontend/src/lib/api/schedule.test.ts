import { describe, expect, it } from "vitest";

import { buildScheduleWeekSnapshot } from "@/lib/api/schedule";

describe("schedule adapter", () => {
  it("keeps weekend days when real classes include them", () => {
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
});

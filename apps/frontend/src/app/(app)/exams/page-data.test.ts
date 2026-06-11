import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { buildExamsPageData } from "@/app/(app)/exams/page-data";

describe("exams page data", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-10T08:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("builds serializable exam route props with class options", () => {
    const data = buildExamsPageData({
      examRecords: [
        {
          id: "exam-1",
          user_id: "user-1",
          class_id: "class-2",
          title: "Physics Finals",
          description: null,
          exam_date: "2026-06-12T09:00:00.000Z",
          location: "Auditorium",
          created_at: "2026-06-01T00:00:00.000Z",
          updated_at: "2026-06-01T00:00:00.000Z",
          deleted_at: null,
        },
      ],
      classRecords: [
        {
          id: "class-2",
          user_id: "user-1",
          subject: "Physics 101",
          room: null,
          instructor: null,
          day_of_week: "thursday",
          start_time: "09:00",
          end_time: "10:00",
          color: "blue",
          is_active: true,
          created_at: "2026-06-01T00:00:00.000Z",
          updated_at: "2026-06-01T00:00:00.000Z",
          deleted_at: null,
        },
      ],
    });

    expect(data).toMatchObject({
      examsAvailable: true,
      classesAvailable: true,
      classOptions: [{ id: "class-2", label: "Physics 101" }],
    });
    expect(data.exams[0]).toMatchObject({
      id: "exam-1",
      subject: "Physics 101",
      location: "Auditorium",
      countdownLabel: "In 2 days",
    });
    expect(JSON.parse(JSON.stringify(data))).toEqual(data);
  });
});

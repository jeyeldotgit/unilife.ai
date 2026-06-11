import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  getChatUpcomingDeadlines,
  getUpcomingDashboardDeadlines,
} from "@/lib/api/deadlines";
import type { Assignment, Exam } from "@/lib/types";

function makeAssignment(overrides: Partial<Assignment> = {}): Assignment {
  return {
    id: "assignment-1",
    title: "Essay Draft",
    subject: "English",
    classId: "class-1",
    dueAt: "2026-06-12T12:00:00.000Z",
    dueDateLabel: "Jun 12",
    icon: "assignment",
    iconColor: "#0058be",
    status: "pending",
    priority: 2,
    description: null,
    urgency: {
      label: "DUE IN 2 DAYS",
      icon: "schedule",
      bgColor: "#ffdad6",
      textColor: "#ba1a1a",
    },
    reminders: [],
    createdAt: "2026-06-01T00:00:00.000Z",
    updatedAt: "2026-06-01T00:00:00.000Z",
    ...overrides,
  };
}

function makeExam(overrides: Partial<Exam> = {}): Exam {
  return {
    id: "exam-1",
    title: "Biology Midterm",
    subject: "Biology",
    classId: "class-2",
    examAt: "2026-06-11T09:00:00.000Z",
    examDateLabel: "Jun 11",
    examTimeLabel: "5:00 PM",
    examDateTimeLabel: "Jun 11 • 5:00 PM",
    countdownLabel: "Tomorrow",
    location: "Lab 2",
    description: null,
    urgency: {
      label: "TOMORROW",
      icon: "warning",
      bgColor: "#ffdad6",
      textColor: "#ba1a1a",
      tone: "danger",
    },
    createdAt: "2026-06-01T00:00:00.000Z",
    updatedAt: "2026-06-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("deadline aggregation", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-10T08:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("merges assignments and exams into route-aware dashboard deadlines", () => {
    const deadlines = getUpcomingDashboardDeadlines(
      [makeAssignment()],
      [makeExam()],
    );

    expect(deadlines).toEqual([
      expect.objectContaining({
        id: "exam-1",
        kind: "exam",
        href: "/exams",
        dueLabel: "Tomorrow",
      }),
      expect.objectContaining({
        id: "assignment-1",
        kind: "assignment",
        href: "/assignments",
        dueLabel: "Due in 2 days",
      }),
    ]);
  });

  it("filters dashboard deadlines to the next seven days", () => {
    const deadlines = getUpcomingDashboardDeadlines(
      [
        makeAssignment({
          id: "assignment-late",
          dueAt: "2026-06-25T12:00:00.000Z",
        }),
      ],
      [
        makeExam({
          id: "exam-past",
          examAt: "2026-06-09T09:00:00.000Z",
        }),
      ],
    );

    expect(deadlines).toEqual([]);
  });

  it("builds sorted chat deadline context with exams included", () => {
    const deadlines = getChatUpcomingDeadlines(
      [
        makeAssignment({
          id: "assignment-2",
          dueAt: "2026-06-13T12:00:00.000Z",
          status: "in_progress",
        }),
      ],
      [makeExam()],
    );

    expect(deadlines).toEqual([
      expect.objectContaining({
        title: "Biology Midterm",
        type: "exam",
        status: "pending",
      }),
      expect.objectContaining({
        title: "Essay Draft",
        type: "assignment",
        status: "in_progress",
      }),
    ]);
  });
});

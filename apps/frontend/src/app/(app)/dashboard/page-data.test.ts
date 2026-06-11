import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { buildDashboardPageData } from "@/app/(app)/dashboard/page-data";
import type { Assignment, BudgetStatus, Exam, ScheduleWeek } from "@/lib/types";

function createRejectedResult(error = new Error("failed")) {
  return {
    status: "rejected" as const,
    reason: error,
  };
}

function createScheduleWeek(): ScheduleWeek {
  return {
    weekLabel: "Jun 8 - Jun 14",
    days: [],
    hours: [],
    classes: [],
    freeWindows: [],
    todayClasses: [
      {
        id: "class-2",
        subject: "Physics",
        startTime: "13:00",
        endTime: "14:00",
        timeLabel: "1:00 PM",
        locationLabel: "Room 4",
      },
      {
        id: "class-1",
        subject: "Math",
        startTime: "09:00",
        endTime: "10:00",
        timeLabel: "9:00 AM",
        locationLabel: "Room 2",
      },
    ],
    classDetails: {},
  };
}

function createAssignment(): Assignment {
  return {
    id: "assignment-1",
    title: "Lab Report",
    subject: "Chemistry",
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
  };
}

function createExam(): Exam {
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
  };
}

function createBudgetStatus(): BudgetStatus {
  return {
    budgetId: "budget-1",
    period: "weekly",
    cycleLabel: "Weekly Budget",
    totalAmount: 1000,
    spentAmount: 200,
    remainingAmount: 800,
    totalLabel: "PHP 1,000",
    spentLabel: "PHP 200",
    remainingLabel: "PHP 800",
    progressPercent: 20,
    progressLabel: "20%",
    estimatedDaysLeft: 5,
    estimateLabel: "5 days left",
    tone: "healthy",
  };
}

describe("dashboard page data", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-10T08:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("sorts today's classes and merges assignment plus exam deadlines", () => {
    const data = buildDashboardPageData({
      scheduleResult: {
        status: "fulfilled",
        value: createScheduleWeek(),
      },
      assignmentsResult: {
        status: "fulfilled",
        value: [createAssignment()],
      },
      examsResult: {
        status: "fulfilled",
        value: [createExam()],
      },
      budgetResult: {
        status: "fulfilled",
        value: createBudgetStatus(),
      },
    });

    expect(data.todayClasses.map((entry) => entry.id)).toEqual([
      "class-1",
      "class-2",
    ]);
    expect(data.upcomingDeadlines.map((entry) => entry.kind)).toEqual([
      "exam",
      "assignment",
    ]);
    expect(data.deadlinesAvailable).toBe(true);
    expect(data.deadlinesPartiallyAvailable).toBe(false);
  });

  it("marks deadline data as partially available when only one source loads", () => {
    const data = buildDashboardPageData({
      scheduleResult: createRejectedResult(),
      assignmentsResult: {
        status: "fulfilled",
        value: [createAssignment()],
      },
      examsResult: createRejectedResult(),
      budgetResult: createRejectedResult(),
    });

    expect(data.scheduleAvailable).toBe(false);
    expect(data.deadlinesAvailable).toBe(true);
    expect(data.deadlinesPartiallyAvailable).toBe(true);
    expect(data.upcomingDeadlines).toHaveLength(1);
    expect(data.budgetAvailable).toBe(false);
  });

  it("marks deadlines unavailable when both sources fail", () => {
    const data = buildDashboardPageData({
      scheduleResult: createRejectedResult(),
      assignmentsResult: createRejectedResult(),
      examsResult: createRejectedResult(),
      budgetResult: createRejectedResult(),
    });

    expect(data.deadlinesAvailable).toBe(false);
    expect(data.deadlinesPartiallyAvailable).toBe(false);
    expect(data.upcomingDeadlines).toEqual([]);
  });
});

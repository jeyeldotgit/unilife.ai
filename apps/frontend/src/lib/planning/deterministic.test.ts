import { describe, expect, it } from "vitest";

import {
  buildAllowanceForecast,
  buildDailyBriefing,
  buildFreeTimePlan,
} from "@/lib/planning/deterministic";

const context = {
  today: "2026-06-12",
  current_time: "10:30",
  todays_classes: [
    { subject: "Math", start_time: "10:00", end_time: "11:00" },
    { subject: "Physics", start_time: "13:00", end_time: "14:00" },
  ],
  upcoming_deadlines: [
    {
      id: "assignment-1",
      title: "Research Paper",
      due_date: "2026-06-13T12:00:00.000Z",
      type: "assignment" as const,
      status: "pending" as const,
      priority: 3,
    },
  ],
  budget_remaining: 300,
  budget_period_end_date: "2026-06-14",
  avg_daily_spend: 150,
};

describe("deterministic planning", () => {
  it("builds a briefing with a real focus item", () => {
    expect(buildDailyBriefing(context)).toMatchObject({
      class_count: 2,
      deadline_count: 1,
      focus_task: { id: "assignment-1" },
      source: "deterministic",
    });
  });

  it("calculates the gap after an active class", () => {
    expect(buildFreeTimePlan(context)).toMatchObject({
      current_class_subject: "Math",
      next_class_subject: "Physics",
      window_minutes: 120,
    });
  });

  it("calculates allowance risk from real cycle values", () => {
    expect(buildAllowanceForecast(context)).toMatchObject({
      recommended_daily_limit: 100,
      projected_runout_days: 2,
      will_last_cycle: false,
    });
  });
});

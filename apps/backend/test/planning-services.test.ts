import { describe, expect, it } from "vitest";

import {
  buildAllowanceForecast,
  buildFreeTimePlan,
  rankDeadlines,
} from "../src/services/planning.service.js";

const baseContext = {
  today: "2026-06-12",
  current_time: "10:30",
  todays_classes: [
    { subject: "Math", start_time: "10:00", end_time: "11:00" },
    { subject: "Physics", start_time: "13:00", end_time: "14:00" },
  ],
  upcoming_deadlines: [],
  budget_remaining: 300,
  budget_period_end_date: "2026-06-14",
  avg_daily_spend: 150,
};

describe("planning service", () => {
  it("starts a free window after the active class ends", () => {
    expect(buildFreeTimePlan(baseContext)).toMatchObject({
      current_class_subject: "Math",
      next_class_subject: "Physics",
      window_minutes: 120,
    });
  });

  it("ranks equal-date assignments by priority then in-progress status", () => {
    const ranked = rankDeadlines(
      [
        {
          title: "Low",
          due_date: "2026-06-13T12:00:00.000Z",
          type: "assignment",
          status: "in_progress",
          priority: 1,
        },
        {
          title: "High",
          due_date: "2026-06-13T12:00:00.000Z",
          type: "assignment",
          status: "pending",
          priority: 3,
        },
      ],
      "2026-06-12",
    );

    expect(ranked.map((task) => task.title)).toEqual(["High", "Low"]);
  });

  it("reports an at-risk allowance cycle and a projected runout date", () => {
    expect(buildAllowanceForecast(baseContext)).toMatchObject({
      days_left_in_cycle: 3,
      projected_runout_days: 2,
      projected_runout_date: "2026-06-14",
      will_last_cycle: false,
    });
  });

  it("does not project runout when average spending is zero", () => {
    expect(buildAllowanceForecast({ ...baseContext, avg_daily_spend: 0 })).toMatchObject({
      projected_runout_days: null,
      projected_runout_date: null,
      will_last_cycle: true,
    });
  });
});

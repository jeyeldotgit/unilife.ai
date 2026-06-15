import { describe, expect, it } from "vitest";

import { materializeExpenseOccurrenceDates } from "./recurring-expenses";

describe("materializeExpenseOccurrenceDates", () => {
  it("materializes a weekly expense through the centralized horizon", () => {
    const dates = materializeExpenseOccurrenceDates({
      frequency: "weekly",
      interval: 1,
      weekdays: ["monday"],
      timezone: "Asia/Manila",
      starts_at: "2026-06-15T01:00:00.000Z",
      ends_at: null,
    });
    expect(dates).toHaveLength(4);
    expect(dates[0]).toBe("2026-06-15T01:00:00.000Z");
  });
});

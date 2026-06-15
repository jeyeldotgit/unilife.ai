import { describe, expect, it } from "vitest";

import { resolveExpenseDateRange } from "./date-ranges";

describe("resolveExpenseDateRange", () => {
  const now = new Date("2026-06-14T17:00:00.000Z");

  it("resolves today in the user's timezone", () => {
    const range = resolveExpenseDateRange("today", "Asia/Manila", now);
    expect(range.fromDate).toBe("2026-06-15");
    expect(range.toDate).toBe("2026-06-15");
  });

  it("starts weeks on Monday", () => {
    const range = resolveExpenseDateRange("week", "Asia/Manila", now);
    expect(range.fromDate).toBe("2026-06-15");
  });

  it("rejects reversed custom ranges", () => {
    expect(() =>
      resolveExpenseDateRange("custom", "UTC", now, { from: "2026-06-16", to: "2026-06-15" }),
    ).toThrow("valid date range");
  });
});

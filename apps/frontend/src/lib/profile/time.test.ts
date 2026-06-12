import { describe, expect, it } from "vitest";

import {
  formatHeaderDate,
  getDateKeyInTimeZone,
  getGreetingForTimeZone,
  getTime24InTimeZone,
} from "@/lib/profile/time";

describe("profile time helpers", () => {
  const sampleDate = new Date("2026-06-12T01:30:00.000Z");

  it("builds timezone-aware date keys and times", () => {
    expect(getDateKeyInTimeZone("Asia/Manila", sampleDate)).toBe("2026-06-12");
    expect(getTime24InTimeZone("Asia/Manila", sampleDate)).toBe("09:30");
  });

  it("calculates greetings at timezone boundaries", () => {
    expect(getGreetingForTimeZone("UTC", new Date("2026-06-12T08:00:00.000Z"))).toBe(
      "Good morning",
    );
    expect(getGreetingForTimeZone("UTC", new Date("2026-06-12T13:00:00.000Z"))).toBe(
      "Good afternoon",
    );
    expect(getGreetingForTimeZone("UTC", new Date("2026-06-12T20:00:00.000Z"))).toBe(
      "Good evening",
    );
  });

  it("formats header dates in the requested timezone", () => {
    expect(formatHeaderDate("Asia/Manila", sampleDate)).toContain("June");
  });
});

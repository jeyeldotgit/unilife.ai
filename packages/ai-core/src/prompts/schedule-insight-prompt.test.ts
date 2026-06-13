import { describe, expect, it } from "vitest";

import { buildScheduleInsightPrompt } from "./schedule-insight-prompt.js";

describe("schedule insight prompt", () => {
  it("keeps insights grounded in schedule data", () => {
    const prompt = buildScheduleInsightPrompt();

    expect(prompt).toContain("today's supplied class blocks");
    expect(prompt).toContain("Do not mention assignments");
    expect(prompt).toContain("Do not invent classes");
  });
});

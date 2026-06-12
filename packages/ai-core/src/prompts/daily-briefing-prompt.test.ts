import { describe, expect, it } from "vitest";

import { buildDailyBriefingPrompt } from "./daily-briefing-prompt.js";

describe("daily briefing prompt", () => {
  it("requires grounded concise output", () => {
    const prompt = buildDailyBriefingPrompt();

    expect(prompt).toContain("grounded only in the supplied context");
    expect(prompt).toContain("Do not invent");
  });
});

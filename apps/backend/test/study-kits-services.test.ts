import { describe, expect, it } from "vitest";

import { cleanStudyText } from "../src/services/study-kits.service.js";

describe("study kits service", () => {
  it("removes repeated reviewer headers, bylines, and page markers", () => {
    const text = [
      "OrgMan - Final Reviewer",
      "Reviewer Made By: Raica D. Caviteno",
      "-- 1 of 11 --",
      "LESSON 1: NATURE OF MANAGEMENT",
      "Management is the process of planning, organizing, leading, and controlling.",
      "OrgMan - Final Reviewer",
      "Reviewer Made By: Raica D. Caviteno",
      "-- 2 of 11 --",
      "Planning involves setting objectives and determining courses of action.",
      "OrgMan - Final Reviewer",
      "Reviewer Made By: Raica D. Caviteno",
      "-- 3 of 11 --",
    ].join("\n");

    const cleaned = cleanStudyText(text);

    expect(cleaned).toContain("LESSON 1: NATURE OF MANAGEMENT");
    expect(cleaned).toContain("Management is the process");
    expect(cleaned).not.toContain("OrgMan - Final Reviewer");
    expect(cleaned).not.toContain("Reviewer Made By");
    expect(cleaned).not.toContain("-- 1 of 11 --");
  });
});

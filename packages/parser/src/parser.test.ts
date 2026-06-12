import { describe, expect, it } from "vitest";
import { ParsedActionSchema, routeIntent } from "./index.js";

const referenceDate = new Date("2026-06-12T08:00:00+08:00");

describe("local parser", () => {
  it("parses an English assignment and defaults date-only deadlines to 11:59 PM", () => {
    const result = routeIntent("submit math homework tomorrow", { referenceDate });

    expect(result).toMatchObject({
      intent: "create_assignment",
      data: { title: "Math" },
    });
    expect(new Date(result.intent === "create_assignment" ? result.data.due_date : 0).getHours()).toBe(23);
  });

  it("normalizes Filipino assignment dates", () => {
    expect(routeIntent("ipasa research paper bukas 9pm", { referenceDate })).toMatchObject({
      intent: "create_assignment",
      data: { title: "Research Paper" },
    });
  });

  it("parses a complete Filipino class command", () => {
    expect(routeIntent("add klase physics lunes 8am to 10am", { referenceDate })).toMatchObject({
      intent: "create_class",
      data: {
        subject: "Physics",
        day_of_week: "monday",
        start_time: "08:00",
        end_time: "10:00",
      },
    });
  });

  it("requires an explicit exam time", () => {
    expect(routeIntent("chemistry exam tomorrow", { referenceDate })).toMatchObject({
      intent: "unknown",
      data: { candidate_intent: "create_exam" },
    });
  });

  it("parses an exam with an explicit date and time", () => {
    expect(routeIntent("chemistry exam tomorrow 9am in room 204", { referenceDate })).toMatchObject({
      intent: "create_exam",
      data: {
        title: "Chemistry",
        location: "Room 204",
      },
    });
  });

  it("parses expenses and categories", () => {
    expect(routeIntent("nagastos ako ng 250 sa school supplies", { referenceDate })).toMatchObject({
      intent: "log_expense",
      data: { amount: 250, category: "school", label: "School Supplies" },
    });
  });

  it("routes deadline queries before assignment creation", () => {
    expect(routeIntent("what's due today?", { referenceDate })).toMatchObject({
      intent: "query_deadlines",
      data: { range: "today" },
    });
  });

  it("rejects invalid class time ranges at the Zod boundary", () => {
    expect(routeIntent("add class physics monday 10am to 8am", { referenceDate })).toMatchObject({
      intent: "unknown",
      data: { reason: "The parsed command was not safe to execute." },
    });
  });

  it("rejects malformed executable actions", () => {
    expect(
      ParsedActionSchema.safeParse({
        intent: "log_expense",
        confidence: 1.2,
        data: { amount: -5, label: "", category: "food" },
      }).success,
    ).toBe(false);
  });
});

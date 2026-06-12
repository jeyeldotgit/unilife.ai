import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  routeIntent: vi.fn(),
  createAssignmentLocal: vi.fn(),
  createClassLocal: vi.fn(),
  createExamLocal: vi.fn(),
  getBudgetStatusLocal: vi.fn(),
  logExpenseLocal: vi.fn(),
  assignments: [] as Array<Record<string, unknown>>,
  exams: [] as Array<Record<string, unknown>>,
  planningContext: null as Record<string, unknown> | null,
}));

vi.mock("@unilife-ai/parser", () => ({
  routeIntent: mocks.routeIntent,
}));

vi.mock("@/lib/mutations/local-data", () => ({
  createAssignmentLocal: mocks.createAssignmentLocal,
  createClassLocal: mocks.createClassLocal,
  createExamLocal: mocks.createExamLocal,
  getBudgetStatusLocal: mocks.getBudgetStatusLocal,
  logExpenseLocal: mocks.logExpenseLocal,
}));

vi.mock("@/lib/db/dexie", () => ({
  db: {
    assignments: {
      where: vi.fn(() => ({
        equals: vi.fn(() => ({
          and: vi.fn((predicate: (record: Record<string, unknown>) => boolean) => ({
            toArray: vi.fn(async () => mocks.assignments.filter(predicate)),
          })),
        })),
      })),
    },
    exams: {
      where: vi.fn(() => ({
        equals: vi.fn(() => ({
          and: vi.fn((predicate: (record: Record<string, unknown>) => boolean) => ({
            toArray: vi.fn(async () => mocks.exams.filter(predicate)),
          })),
        })),
      })),
    },
  },
}));

vi.mock("@/lib/session/current-user", () => ({
  getCurrentUserId: vi.fn(() => "user-1"),
}));

vi.mock("@/lib/planning/local-context", () => ({
  getLocalPlanningContext: vi.fn(async () => mocks.planningContext),
}));

import { resolveLocalChat } from "@/lib/chat/local-executor";

describe("local chat executor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.assignments.length = 0;
    mocks.exams.length = 0;
    mocks.planningContext = null;
  });

  it("executes a locally parsed assignment through the Dexie mutation helper", async () => {
    mocks.routeIntent.mockReturnValue({
      intent: "create_assignment",
      confidence: 0.9,
      data: {
        title: "Research Paper",
        due_date: "2099-06-20T15:59:00.000Z",
      },
    });
    mocks.createAssignmentLocal.mockResolvedValue({
      id: "assignment-1",
      title: "Research Paper",
      subject: "No class",
      dueAt: "2099-06-20T15:59:00.000Z",
    });

    const result = await resolveLocalChat("submit research paper june 20");

    expect(mocks.createAssignmentLocal).toHaveBeenCalledWith({
      title: "Research Paper",
      dueAt: "2099-06-20T15:59:00.000Z",
      classId: null,
    });
    expect(result).toMatchObject({
      handled: true,
      message: { kind: "assignment_confirmation" },
    });
  });

  it("returns a specific offline-safe clarification for ambiguous commands", async () => {
    mocks.routeIntent.mockReturnValue({
      intent: "unknown",
      confidence: 0.5,
      data: {
        candidate_intent: "create_exam",
        reason: "Include the exact exam date and time.",
      },
    });

    const result = await resolveLocalChat("chemistry exam tomorrow");

    expect(result).toMatchObject({
      handled: false,
      offlineMessage: {
        kind: "text",
        text: expect.stringContaining("Include the exact exam date and time."),
      },
    });
  });

  it("returns the next five local deadlines in chronological order", async () => {
    const futureDate = (days: number) => {
      const date = new Date();
      date.setDate(date.getDate() + days);
      return date.toISOString();
    };

    mocks.routeIntent.mockReturnValue({
      intent: "query_deadlines",
      confidence: 0.95,
      data: { range: "next_seven_days" },
    });
    mocks.assignments.push(
      ...Array.from({ length: 6 }, (_, index) => ({
        id: `assignment-${index + 1}`,
        title: `Assignment ${index + 1}`,
        due_date: futureDate(index + 1),
        status: "pending",
        deleted_at: null,
      })),
    );

    const result = await resolveLocalChat("what's due?");

    expect(result).toMatchObject({
      handled: true,
      message: {
        kind: "text",
        text: expect.stringContaining("1. Assignment 1"),
      },
    });
    if (result.handled && result.message.kind === "text") {
      expect(result.message.text).toContain("5. Assignment 5");
      expect(result.message.text).not.toContain("Assignment 6");
    }
  });

  it("builds a structured offline allowance forecast while deferring online", async () => {
    mocks.routeIntent.mockReturnValue({
      intent: "query_allowance_forecast",
      confidence: 0.95,
      data: {},
    });
    mocks.planningContext = {
      today: "2026-06-12",
      current_time: "10:00",
      todays_classes: [],
      upcoming_deadlines: [],
      budget_remaining: 420,
      budget_period_end_date: "2026-06-16",
      avg_daily_spend: 210,
    };

    const result = await resolveLocalChat("will my allowance last?");

    expect(result).toMatchObject({
      handled: false,
      offlineMessage: {
        kind: "allowance_forecast",
        payload: {
          remaining: 420,
          will_last_cycle: false,
        },
      },
    });
  });
});

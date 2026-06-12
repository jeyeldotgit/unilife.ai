import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  aiLogs: [] as Record<string, unknown>[],
  callGemini: vi.fn(),
  logShouldFail: false,
  repositoryConstructors: {
    assignments: vi.fn(),
    budgets: vi.fn(),
    classes: vi.fn(),
    exams: vi.fn(),
    expenses: vi.fn(),
  },
}));

vi.mock("@unilife-ai/ai-core", () => ({
  buildDailyBriefingPrompt: () => "daily briefing prompt",
  callGemini: state.callGemini,
}));

vi.mock("../src/lib/supabase.js", () => ({
  createSupabaseClient: () => ({
    auth: {
      getUser: async (token: string) => {
        if (token === "valid-token") {
          return {
            data: { user: { id: "user-1" } },
            error: null,
          };
        }

        return {
          data: { user: null },
          error: { message: "Invalid token" },
        };
      },
    },
  }),
}));

vi.mock("../src/repositories/health.repository.js", () => ({
  HealthRepository: class HealthRepository {
    async isDatabaseReachable() {
      return true;
    }
  },
}));

vi.mock("../src/repositories/ai-logs.repository.js", () => ({
  AILogsRepository: class AILogsRepository {
    async create(record: Record<string, unknown>) {
      if (state.logShouldFail) {
        throw new Error("logging failed");
      }

      state.aiLogs.push(record);
    }
  },
}));

vi.mock("../src/repositories/assignments.repository.js", () => ({
  AssignmentsRepository: class AssignmentsRepository {
    constructor() {
      state.repositoryConstructors.assignments();
    }
  },
}));

vi.mock("../src/repositories/budgets.repository.js", () => ({
  BudgetsRepository: class BudgetsRepository {
    constructor() {
      state.repositoryConstructors.budgets();
    }
  },
}));

vi.mock("../src/repositories/classes.repository.js", () => ({
  ClassesRepository: class ClassesRepository {
    constructor() {
      state.repositoryConstructors.classes();
    }
  },
}));

vi.mock("../src/repositories/exams.repository.js", () => ({
  ExamsRepository: class ExamsRepository {
    constructor() {
      state.repositoryConstructors.exams();
    }
  },
}));

vi.mock("../src/repositories/expenses.repository.js", () => ({
  ExpensesRepository: class ExpensesRepository {
    constructor() {
      state.repositoryConstructors.expenses();
    }
  },
}));

function createRequestBody() {
  return {
    message: "May biology ako tuwing Thursday 10am.",
    context: {
      today: "2026-06-08",
      current_time: "13:00",
      todays_classes: [],
      upcoming_deadlines: [],
      budget_remaining: 500,
      budget_period_end_date: "2026-06-10",
      avg_daily_spend: 125,
    },
  };
}

beforeEach(() => {
  vi.resetModules();
  state.callGemini.mockReset();
  state.repositoryConstructors.assignments.mockReset();
  state.repositoryConstructors.budgets.mockReset();
  state.repositoryConstructors.classes.mockReset();
  state.repositoryConstructors.exams.mockReset();
  state.repositoryConstructors.expenses.mockReset();
  state.aiLogs = [];
  state.logShouldFail = false;
});

describe("POST /api/ai/chat", () => {
  it("rejects unauthenticated requests before Gemini or logging runs", async () => {
    const { app } = await import("../src/app.js");

    const response = await app.request("http://localhost/api/ai/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(createRequestBody()),
    });
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error.code).toBe("UNAUTHENTICATED");
    expect(state.callGemini).not.toHaveBeenCalled();
    expect(state.aiLogs).toHaveLength(0);
  });

  it("returns a normalized AI response, logs success, and avoids domain CRUD repositories", async () => {
    state.callGemini.mockResolvedValue({
      intent: "create_class",
      action: {
        subject: "Biology",
        day_of_week: "thursday",
        start_time: "10:00",
        end_time: "11:00",
        room: "Lab 1",
      },
      message: "Narito ang class details mo.",
      confidence: 0.95,
    });

    const { app } = await import("../src/app.js");

    const response = await app.request("http://localhost/api/ai/chat", {
      method: "POST",
      headers: {
        Authorization: "Bearer valid-token",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(createRequestBody()),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      intent: "create_class",
      action: {
        subject: "Biology",
        day_of_week: "thursday",
        start_time: "10:00",
        end_time: "11:00",
      },
      message: "Narito ang class details mo.",
      requires_confirmation: true,
    });
    expect(state.aiLogs).toHaveLength(1);
    expect(state.aiLogs[0]).toEqual({
      id: expect.any(String),
      user_id: "user-1",
      raw_input: "May biology ako tuwing Thursday 10am.",
      detected_intent: "create_class",
      confidence: 0.95,
      processing_layer: "gemini",
      structured_output: {
        intent: "create_class",
        action: {
          subject: "Biology",
          day_of_week: "thursday",
          start_time: "10:00",
          end_time: "11:00",
          room: "Lab 1",
        },
        message: "Narito ang class details mo.",
        confidence: 0.95,
      },
      error: null,
    });
    expect(state.repositoryConstructors.assignments).not.toHaveBeenCalled();
    expect(state.repositoryConstructors.budgets).not.toHaveBeenCalled();
    expect(state.repositoryConstructors.classes).not.toHaveBeenCalled();
    expect(state.repositoryConstructors.exams).not.toHaveBeenCalled();
    expect(state.repositoryConstructors.expenses).not.toHaveBeenCalled();
  });

  it("returns the safe unknown fallback and logs the failure when Gemini fails", async () => {
    state.callGemini.mockRejectedValue(new Error("quota exceeded"));

    const { app } = await import("../src/app.js");

    const response = await app.request("http://localhost/api/ai/chat", {
      method: "POST",
      headers: {
        Authorization: "Bearer valid-token",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(createRequestBody()),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      intent: "unknown",
      action: null,
      message: "I couldn't understand that. Try rephrasing.",
      requires_confirmation: false,
    });
    expect(state.aiLogs).toHaveLength(1);
    expect(state.aiLogs[0]).toEqual({
      id: expect.any(String),
      user_id: "user-1",
      raw_input: "May biology ako tuwing Thursday 10am.",
      detected_intent: null,
      confidence: null,
      processing_layer: "gemini",
      structured_output: null,
      error: "quota exceeded",
    });
  });

  it("still returns the AI response when logging fails", async () => {
    state.logShouldFail = true;
    state.callGemini.mockResolvedValue({
      intent: "general_question",
      action: null,
      message: "Focus on your next deadline first.",
      confidence: 0.9,
    });

    const { app } = await import("../src/app.js");

    const response = await app.request("http://localhost/api/ai/chat", {
      method: "POST",
      headers: {
        Authorization: "Bearer valid-token",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(createRequestBody()),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      intent: "general_question",
      action: null,
      message: "Focus on your next deadline first.",
      requires_confirmation: false,
    });
    expect(state.aiLogs).toHaveLength(0);
  });
});

describe("POST /api/ai/briefing", () => {
  it("returns a deterministic briefing when Gemini is unavailable", async () => {
    state.callGemini.mockRejectedValue(new Error("offline"));
    const { app } = await import("../src/app.js");

    const response = await app.request("http://localhost/api/ai/briefing", {
      method: "POST",
      headers: {
        Authorization: "Bearer valid-token",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ context: createRequestBody().context }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      class_count: 0,
      deadline_count: 0,
      source: "deterministic",
    });
  });
});

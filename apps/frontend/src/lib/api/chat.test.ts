import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createAssignment: vi.fn(),
  getAssignments: vi.fn(),
  getExams: vi.fn(),
  getBudgetChatContext: vi.fn(),
  getBudgetStatus: vi.fn(),
  logExpense: vi.fn(),
  getClasses: vi.fn(),
  requestBackend: vi.fn(),
}));

vi.mock("@/lib/api/assignments", () => ({
  createAssignment: mocks.createAssignment,
  getAssignments: mocks.getAssignments,
}));

vi.mock("@/lib/api/exams", () => ({
  getExams: mocks.getExams,
}));

vi.mock("@/lib/api/budget", () => ({
  getBudgetChatContext: mocks.getBudgetChatContext,
  getBudgetStatus: mocks.getBudgetStatus,
}));

vi.mock("@/lib/api/expenses", () => ({
  logExpense: mocks.logExpense,
}));

vi.mock("@/lib/api/schedule", () => ({
  getClasses: mocks.getClasses,
}));

vi.mock("@/lib/api/client", () => ({
  requestBackend: mocks.requestBackend,
}));

describe("chat adapter", () => {
  beforeEach(() => {
    mocks.getClasses.mockReset();
    mocks.getAssignments.mockReset();
    mocks.getExams.mockReset();
    mocks.getBudgetChatContext.mockReset();
    mocks.getBudgetStatus.mockReset();
    mocks.logExpense.mockReset();
    mocks.createAssignment.mockReset();
    mocks.requestBackend.mockReset();

    mocks.getClasses.mockResolvedValue({
      todayClasses: [],
    });
    mocks.getAssignments.mockResolvedValue([]);
    mocks.getExams.mockResolvedValue([]);
    mocks.getBudgetChatContext.mockResolvedValue({
      avgDailySpend: null,
      budgetPeriodEndDate: null,
      budgetRemaining: null,
    });
    mocks.getBudgetStatus.mockResolvedValue(null);
  });

  it("maps plain AI replies to text messages", async () => {
    mocks.requestBackend.mockResolvedValue({
      intent: "general_question",
      action: null,
      message: "Hello from UniLife.",
      requires_confirmation: false,
    });

    const { sendMessage } = await import("@/lib/api/chat");
    const result = await sendMessage({ text: "hello" });

    expect(result.responseMessage).toMatchObject({
      kind: "text",
      text: "Hello from UniLife.",
    });
  });

  it("maps free-time responses into the existing recommendation card shape", async () => {
    mocks.requestBackend.mockResolvedValue({
      intent: "free_time_finder",
      action: null,
      message: "Start with the most urgent task.",
      requires_confirmation: false,
      free_time: {
        window_minutes: 120,
        next_class_subject: "Physics",
        next_class_time: "15:00",
        suggested_tasks: [
          {
            title: "Research Paper",
            due_date: "2099-06-05T23:59:00.000Z",
            type: "assignment",
            urgency_days: 2,
          },
        ],
      },
    });

    const { sendMessage } = await import("@/lib/api/chat");
    const result = await sendMessage({ text: "what should I do right now?" });

    expect(result.responseMessage).toMatchObject({
      kind: "free_time_recommendation",
      payload: expect.objectContaining({
        nextClassLabel: "Physics starts at 15:00",
      }),
    });
  });

  it("auto-saves high-confidence assignment intents into confirmation cards", async () => {
    mocks.requestBackend.mockResolvedValue({
      intent: "create_assignment",
      action: {
        title: "Research Paper",
        due_date: "2099-06-05T23:59:00.000Z",
        class_id: null,
      },
      message: "I added that for you.",
      requires_confirmation: false,
    });

    const { sendMessage } = await import("@/lib/api/chat");
    const result = await sendMessage({ text: "book report next friday 11:59pm" });

    expect(result.clientEffect).toMatchObject({
      kind: "create_assignment",
      payload: expect.objectContaining({
        dueAt: "2099-06-05T23:59:00.000Z",
        title: "Research Paper",
      }),
    });
    expect(result.responseMessage).toMatchObject({
      kind: "text",
      text: "I added that for you.",
    });
  });

  it("auto-saves high-confidence expense intents into confirmation cards", async () => {
    mocks.requestBackend.mockResolvedValue({
      intent: "log_expense",
      action: {
        amount: 85,
        category: "food",
      },
      message: "Logged.",
      requires_confirmation: false,
    });

    const { sendMessage } = await import("@/lib/api/chat");
    const result = await sendMessage({ text: "lunch 85" });

    expect(result.clientEffect).toMatchObject({
      kind: "log_expense",
      payload: expect.objectContaining({
        amount: 85,
        category: "food",
        label: "Lunch",
      }),
    });
    expect(result.responseMessage).toMatchObject({
      kind: "text",
      text: "Logged.",
    });
  });

  it("maps complete class intents into a local class client effect", async () => {
    mocks.requestBackend.mockResolvedValue({
      intent: "create_class",
      action: {
        day_of_week: "friday",
        end_time: "19:00:00",
        start_time: "17:00:00",
        subject: "Orgman",
      },
      message: "Sige, idadagdag ko ang klase mo sa Orgman.",
      requires_confirmation: false,
    });

    const { sendMessage } = await import("@/lib/api/chat");
    const result = await sendMessage({ text: "add class on orgman tomorrow 5pm to 7pm" });

    expect(result.clientEffect).toMatchObject({
      kind: "create_class",
      payload: expect.objectContaining({
        dayOfWeek: "friday",
        dayIndex: 4,
        endTime: "19:00",
        startTime: "17:00",
        subject: "Orgman",
      }),
    });
  });

  it("includes exams alongside assignments in the chat deadline context", async () => {
    mocks.getAssignments.mockResolvedValue([
      {
        id: "assignment-1",
        title: "Essay Draft",
        dueAt: "2026-06-12T12:00:00.000Z",
        status: "pending",
      },
    ]);
    mocks.getExams.mockResolvedValue([
      {
        id: "exam-1",
        title: "Biology Midterm",
        examAt: "2099-06-11T09:00:00.000Z",
      },
    ]);
    mocks.requestBackend.mockResolvedValue({
      intent: "general_question",
      action: null,
      message: "Here is your workload.",
      requires_confirmation: false,
    });

    const { sendMessage } = await import("@/lib/api/chat");
    await sendMessage({ text: "what's due?" });

    expect(mocks.requestBackend).toHaveBeenCalledWith(
      "/api/ai/chat",
      expect.objectContaining({
        body: expect.objectContaining({
          context: expect.objectContaining({
            upcoming_deadlines: [
              {
                title: "Essay Draft",
                due_date: "2026-06-12T12:00:00.000Z",
                type: "assignment",
                status: "pending",
              },
              {
                title: "Biology Midterm",
                due_date: "2099-06-11T09:00:00.000Z",
                type: "exam",
                status: "pending",
              },
            ],
          }),
        }),
      }),
    );
  });
});

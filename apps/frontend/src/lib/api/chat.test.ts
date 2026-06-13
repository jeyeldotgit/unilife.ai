import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createAssignment: vi.fn(),
  getAssignments: vi.fn(),
  getExams: vi.fn(),
  getBudgetChatContext: vi.fn(),
  getBudgetStatus: vi.fn(),
  logExpense: vi.fn(),
  listExpenseRecords: vi.fn(),
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

vi.mock("@/lib/api/finance-data", () => ({
  listExpenseRecords: mocks.listExpenseRecords,
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
    mocks.listExpenseRecords.mockReset();
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
    mocks.listExpenseRecords.mockResolvedValue([]);
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
        recommendations: [
          expect.objectContaining({
            kind: "assignment",
            typeLabel: "Assignment",
          }),
        ],
      }),
    });
  });

  it("returns high-confidence assignment intents for review without auto-saving", async () => {
    mocks.requestBackend.mockResolvedValue({
      intent: "create_assignment",
      action: {
        title: "Research Paper",
        due_date: "2099-06-05T23:59:00.000Z",
        class_id: null,
      },
      message: "I added that for you.",
      requires_confirmation: true,
      proposal: {
        id: "proposal-1",
        processing_layer: "gemini",
        status: "proposed",
        operations: [],
        created_at: "2026-06-13T00:00:00.000Z",
        updated_at: "2026-06-13T00:00:00.000Z",
      },
    });

    const { sendMessage } = await import("@/lib/api/chat");
    const result = await sendMessage({ text: "book report next friday 11:59pm" });

    expect(result.responseMessage).toMatchObject({
      kind: "proposal_review",
      payload: { id: "proposal-1" },
    });
  });

  it("returns high-confidence expense intents for review without auto-saving", async () => {
    mocks.requestBackend.mockResolvedValue({
      intent: "log_expense",
      action: {
        amount: 85,
        category: "food",
      },
      message: "Logged.",
      requires_confirmation: true,
      proposal: {
        id: "proposal-2",
        processing_layer: "gemini",
        status: "proposed",
        operations: [],
        created_at: "2026-06-13T00:00:00.000Z",
        updated_at: "2026-06-13T00:00:00.000Z",
      },
    });

    const { sendMessage } = await import("@/lib/api/chat");
    const result = await sendMessage({ text: "lunch 85" });

    expect(result.responseMessage).toMatchObject({
      kind: "proposal_review",
      payload: { id: "proposal-2" },
    });
  });

  it("maps complete class intents into a review proposal", async () => {
    mocks.requestBackend.mockResolvedValue({
      intent: "create_class",
      action: {
        day_of_week: "friday",
        end_time: "19:00:00",
        start_time: "17:00:00",
        subject: "Orgman",
      },
      message: "Sige, idadagdag ko ang klase mo sa Orgman.",
      requires_confirmation: true,
      proposal: {
        id: "proposal-3",
        processing_layer: "gemini",
        status: "proposed",
        operations: [],
        created_at: "2026-06-13T00:00:00.000Z",
        updated_at: "2026-06-13T00:00:00.000Z",
      },
    });

    const { sendMessage } = await import("@/lib/api/chat");
    const result = await sendMessage({ text: "add class on orgman tomorrow 5pm to 7pm" });

    expect(result.responseMessage).toMatchObject({
      kind: "proposal_review",
      payload: { id: "proposal-3" },
    });
  });

  it("maps complete exam intents into a review proposal", async () => {
    mocks.requestBackend.mockResolvedValue({
      intent: "create_exam",
      action: {
        title: "Chemistry Quiz",
        exam_date: "2099-06-20T08:30:00.000Z",
        class_id: "class-1",
        location: "Room 204",
      },
      message: "I added your exam.",
      requires_confirmation: true,
      proposal: {
        id: "proposal-4",
        processing_layer: "gemini",
        status: "proposed",
        operations: [],
        created_at: "2026-06-13T00:00:00.000Z",
        updated_at: "2026-06-13T00:00:00.000Z",
      },
    });

    const { sendMessage } = await import("@/lib/api/chat");
    const result = await sendMessage({ text: "add chemistry quiz on june 20 at 8:30am" });

    expect(result.responseMessage).toMatchObject({
      kind: "proposal_review",
      payload: { id: "proposal-4" },
    });
  });

  it("does not auto-save expenses when AI omits the category", async () => {
    mocks.requestBackend.mockResolvedValue({
      intent: "log_expense",
      action: {
        amount: 120,
      },
      message: "Logged.",
      requires_confirmation: false,
    });

    const { sendMessage } = await import("@/lib/api/chat");
    const result = await sendMessage({ text: "transpo 120" });

    expect(result.clientEffect).toBeUndefined();
    expect(result.responseMessage.kind).toBe("text");
  });

  it("returns a specific class clarification instead of a generic fallback", async () => {
    mocks.requestBackend.mockResolvedValue({
      intent: "create_class",
      action: {
        subject: "Orgman",
      },
      message: "I couldn't understand that. Try rephrasing.",
      requires_confirmation: true,
    });

    const { sendMessage } = await import("@/lib/api/chat");
    const result = await sendMessage({ text: "add my orgman class" });

    expect(result.responseMessage).toMatchObject({
      kind: "text",
      text: "I can add that class once I have the subject, day, start time, and end time.",
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
                id: "assignment-1",
                title: "Essay Draft",
                due_date: "2026-06-12T12:00:00.000Z",
                type: "assignment",
                status: "pending",
              },
              {
                id: "exam-1",
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

  it("keeps exam recommendations distinct in the free-time card", async () => {
    mocks.requestBackend.mockResolvedValue({
      intent: "free_time_finder",
      action: null,
      message: "Focus on the quiz first.",
      requires_confirmation: false,
      free_time: {
        window_minutes: 90,
        next_class_subject: null,
        next_class_time: null,
        suggested_tasks: [
          {
            title: "Biology Midterm",
            due_date: "2099-06-11T09:00:00.000Z",
            type: "exam",
            urgency_days: 1,
          },
        ],
      },
    });

    const { sendMessage } = await import("@/lib/api/chat");
    const result = await sendMessage({ text: "what should I do right now?" });

    expect(result.responseMessage).toMatchObject({
      kind: "free_time_recommendation",
      payload: expect.objectContaining({
        nextClassLabel: "No more classes are scheduled after this window.",
        recommendations: [
          expect.objectContaining({
            kind: "exam",
            typeLabel: "Exam",
            title: "Biology Midterm",
          }),
        ],
      }),
    });
  });

  it("maps allowance forecasts into a structured forecast card", async () => {
    mocks.requestBackend.mockResolvedValue({
      intent: "allowance_forecast",
      action: null,
      message: "Keep spending under the safe daily limit.",
      requires_confirmation: false,
      forecast: {
        remaining: 420,
        days_left_in_cycle: 5,
        avg_daily_spend: 210,
        projected_runout_days: 2,
        projected_runout_date: "2026-06-14",
        recommended_daily_limit: 84,
        will_last_cycle: false,
      },
    });

    const { sendMessage } = await import("@/lib/api/chat");
    const result = await sendMessage({ text: "will my allowance last?" });

    expect(result.responseMessage).toMatchObject({
      kind: "allowance_forecast",
      payload: {
        remaining: 420,
        will_last_cycle: false,
        closingText: "Keep spending under the safe daily limit.",
      },
    });
  });
});

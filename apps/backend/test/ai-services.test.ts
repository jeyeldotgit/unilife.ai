import { describe, expect, it, vi } from "vitest";

import { AIService } from "../src/services/ai.service.js";

function createContext(overrides: Partial<Parameters<AIService["processChat"]>[0]["context"]> = {}) {
  return {
    today: "2026-06-08",
    current_time: "13:00",
    todays_classes: [
      {
        subject: "History",
        start_time: "15:00",
        end_time: "16:00",
      },
      {
        subject: "Math",
        start_time: "09:00",
        end_time: "10:00",
      },
    ],
    upcoming_deadlines: [
      {
        title: "Research Paper",
        due_date: "2026-06-10T12:00:00.000Z",
        type: "assignment" as const,
        status: "pending" as const,
      },
      {
        title: "Physics Quiz",
        due_date: "2026-06-12T08:00:00.000Z",
        type: "exam" as const,
        status: "in_progress" as const,
      },
    ],
    budget_remaining: 500,
    budget_period_end_date: "2026-06-10",
    avg_daily_spend: 125,
    ...overrides,
  };
}

describe("AIService", () => {
  it("allows auto-confirm for high-confidence assignment proposals", async () => {
    const service = new AIService(
      {} as never,
      "user-1",
      { create: vi.fn() } as never,
      vi.fn(async () => ({
        intent: "create_assignment",
        action: {
          title: "Research Paper",
          due_date: "2026-06-11T12:00:00.000Z",
        },
        message: "Review this assignment.",
        confidence: 0.99,
      })),
    );

    const result = await service.processChat({
      message: "Add my research paper.",
      context: createContext(),
    });

    expect(result.response.requires_confirmation).toBe(false);
    expect(result.response.proposal).toMatchObject({
      status: "proposed",
      operations: [
        expect.objectContaining({
          entity_type: "assignment",
          operation: "create",
          status: "proposed",
        }),
      ],
    });
  });

  it("normalizes structured assignment actions and keeps them auto-confirm eligible", async () => {
    const service = new AIService(
      {} as never,
      "user-1",
      { create: vi.fn() } as never,
      vi.fn(async () => ({
        intent: "create_assignment",
        action: {
          title: "Research Paper",
          due_date: "2026-06-11T12:00:00.000Z",
          class_id: null,
          extra_field: "ignored",
        },
        message: "I found your assignment details.",
        confidence: 0.6,
      })),
    );

    const result = await service.processChat({
      message: "Add my research paper due on Friday.",
      context: createContext(),
    });

    expect(result.response).toMatchObject({
      intent: "create_assignment",
      action: {
        title: "Research Paper",
        due_date: "2026-06-11T12:00:00.000Z",
        class_id: null,
      },
      message: "I found your assignment details.",
      requires_confirmation: false,
    });
    expect(result.log.detected_intent).toBe("create_assignment");
    expect(result.log.confidence).toBe(0.6);
    expect(result.log.error).toBeNull();
  });

  it("always requires confirmation for create_class responses", async () => {
    const service = new AIService(
      {} as never,
      "user-1",
      { create: vi.fn() } as never,
      vi.fn(async () => ({
        intent: "create_class",
        action: {
          subject: "Biology",
          day_of_week: "thursday",
          start_time: "10:00",
          end_time: "11:00",
          room: "Lab 1",
        },
        message: "Narito ang class details mo.",
        confidence: 0.98,
      })),
    );

    const result = await service.processChat({
      message: "May biology ako tuwing Thursday 10am.",
      context: createContext(),
    });

    expect(result.response).toMatchObject({
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
  });

  it("forces action to null for non-CRUD intents", async () => {
    const service = new AIService(
      {} as never,
      "user-1",
      { create: vi.fn() } as never,
      vi.fn(async () => ({
        intent: "general_question",
        action: {
          title: "Should not be returned",
        },
        message: "Focus on your most urgent task first.",
        confidence: 0.92,
      })),
    );

    const result = await service.processChat({
      message: "What should I work on next?",
      context: createContext(),
    });

    expect(result.response).toMatchObject({
      intent: "general_question",
      action: null,
      message: "Focus on your most urgent task first.",
      requires_confirmation: false,
    });
  });

  it("computes an allowance forecast when budget context is complete", async () => {
    const service = new AIService(
      {} as never,
      "user-1",
      { create: vi.fn() } as never,
      vi.fn(async () => ({
        intent: "allowance_forecast",
        action: null,
        message: "Your budget should still last if you slow down a bit.",
        confidence: 0.9,
      })),
    );

    const result = await service.processChat({
      message: "Will my allowance last?",
      context: createContext(),
    });

    expect(result.response).toMatchObject({
      intent: "allowance_forecast",
      action: null,
      message: "Your budget should still last if you slow down a bit.",
      forecast: {
        remaining: 500,
        days_left_in_cycle: 3,
        avg_daily_spend: 125,
        projected_runout_days: 4,
        projected_runout_date: "2026-06-12",
        recommended_daily_limit: 500 / 3,
        will_last_cycle: true,
      },
      requires_confirmation: false,
    });
  });

  it("omits the allowance forecast when required budget context is missing", async () => {
    const service = new AIService(
      {} as never,
      "user-1",
      { create: vi.fn() } as never,
      vi.fn(async () => ({
        intent: "allowance_forecast",
        action: null,
        message: "I need more budget context to estimate that.",
        confidence: 0.8,
      })),
    );

    const result = await service.processChat({
      message: "Will my allowance last?",
      context: createContext({
        avg_daily_spend: null,
      }),
    });

    expect(result.response).toMatchObject({
      intent: "allowance_forecast",
      action: null,
      message: "I need more budget context to estimate that.",
      requires_confirmation: false,
    });
  });

  it("computes free time from the next class and sorts suggested tasks by due date", async () => {
    const service = new AIService(
      {} as never,
      "user-1",
      { create: vi.fn() } as never,
      vi.fn(async () => ({
        intent: "free_time_finder",
        action: null,
        message: "You have time for your research paper before class.",
        confidence: 0.93,
      })),
    );

    const result = await service.processChat({
      message: "What should I do right now?",
      context: createContext(),
    });

    expect(result.response).toMatchObject({
      intent: "free_time_finder",
      action: null,
      message: "You have time for your research paper before class.",
      free_time: {
        window_minutes: 120,
        current_class_subject: null,
        next_class_subject: "History",
        next_class_time: "15:00",
        suggested_tasks: [
          {
            title: "Research Paper",
            due_date: "2026-06-10T12:00:00.000Z",
            type: "assignment",
            status: "pending",
            urgency_days: 2,
          },
          {
            title: "Physics Quiz",
            due_date: "2026-06-12T08:00:00.000Z",
            type: "exam",
            status: "in_progress",
            urgency_days: 4,
          },
        ],
      },
      requires_confirmation: false,
    });
  });

  it("uses the remainder of the day when there is no later class", async () => {
    const service = new AIService(
      {} as never,
      "user-1",
      { create: vi.fn() } as never,
      vi.fn(async () => ({
        intent: "free_time_finder",
        action: null,
        message: "You are free for the rest of the day.",
        confidence: 0.88,
      })),
    );

    const result = await service.processChat({
      message: "What should I do tonight?",
      context: createContext({
        current_time: "21:30",
      }),
    });

    expect(result.response).toMatchObject({
      intent: "free_time_finder",
      action: null,
      message: "You are free for the rest of the day.",
      free_time: {
        window_minutes: 150,
        current_class_subject: null,
        next_class_subject: null,
        next_class_time: null,
        suggested_tasks: [
          {
            title: "Research Paper",
            due_date: "2026-06-10T12:00:00.000Z",
            type: "assignment",
            status: "pending",
            urgency_days: 2,
          },
          {
            title: "Physics Quiz",
            due_date: "2026-06-12T08:00:00.000Z",
            type: "exam",
            status: "in_progress",
            urgency_days: 4,
          },
        ],
      },
      requires_confirmation: false,
    });
  });

  it("falls back safely on timeout failures", async () => {
    const service = new AIService(
      {} as never,
      "user-1",
      { create: vi.fn() } as never,
      vi.fn(async () => {
        throw new Error("timeout");
      }),
    );

    const result = await service.processChat({
      message: "hello",
      context: createContext(),
    });

    expect(result.response.intent).toBe("unknown");
    expect(result.response.action).toBeNull();
    expect(result.response.requires_confirmation).toBe(false);
    expect(result.log.error).toBe("timeout");
  });

  it("returns a deterministic free-time plan when Gemini fails", async () => {
    const service = new AIService(
      {} as never,
      "user-1",
      { create: vi.fn() } as never,
      vi.fn(async () => {
        throw new Error("timeout");
      }),
    );

    const result = await service.processChat({
      message: "What should I do right now?",
      context: createContext(),
    });

    expect(result.response).toMatchObject({
      intent: "free_time_finder",
      free_time: {
        next_class_subject: "History",
        suggested_tasks: expect.arrayContaining([
          expect.objectContaining({ title: "Research Paper" }),
        ]),
      },
    });
    expect(result.log.error).toBe("timeout");
  });

  it("falls back safely on quota failures", async () => {
    const service = new AIService(
      {} as never,
      "user-1",
      { create: vi.fn() } as never,
      vi.fn(async () => {
        throw new Error("quota exceeded");
      }),
    );

    const result = await service.processChat({
      message: "hello",
      context: createContext(),
    });

    expect(result.response.intent).toBe("unknown");
    expect(result.log.error).toBe("quota exceeded");
  });

  it("falls back safely on malformed JSON failures", async () => {
    const service = new AIService(
      {} as never,
      "user-1",
      { create: vi.fn() } as never,
      vi.fn(async () => {
        throw new SyntaxError("Unexpected token");
      }),
    );

    const result = await service.processChat({
      message: "hello",
      context: createContext(),
    });

    expect(result.response.intent).toBe("unknown");
    expect(result.log.error).toBe("Unexpected token");
  });

  it("falls back safely on validation failures", async () => {
    const service = new AIService(
      {} as never,
      "user-1",
      { create: vi.fn() } as never,
      vi.fn(async () => {
        throw new Error("schema validation failed");
      }),
    );

    const result = await service.processChat({
      message: "hello",
      context: createContext(),
    });

    expect(result.response.intent).toBe("unknown");
    expect(result.log.error).toBe("schema validation failed");
  });

  it("persists AI logs with a generated id and gemini processing layer", async () => {
    const create = vi.fn(async () => undefined);
    const service = new AIService(
      {} as never,
      "user-1",
      { create } as never,
      vi.fn(),
    );

    await service.logChat({
      raw_input: "Will my allowance last?",
      detected_intent: "allowance_forecast",
      confidence: 0.8,
      structured_output: {
        intent: "allowance_forecast",
      },
      error: null,
    });

    expect(create).toHaveBeenCalledWith({
      id: expect.any(String),
      user_id: "user-1",
      raw_input: "Will my allowance last?",
      detected_intent: "allowance_forecast",
      confidence: 0.8,
      processing_layer: "gemini",
      structured_output: {
        intent: "allowance_forecast",
      },
      error: null,
    });
  });
});

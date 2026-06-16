import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  assignments: [] as Record<string, unknown>[],
  classes: [] as Record<string, unknown>[],
}));

vi.mock("../src/repositories/health.repository.js", () => ({
  HealthRepository: class HealthRepository {
    async isDatabaseReachable() {
      return true;
    }
  },
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

vi.mock("../src/repositories/classes.repository.js", () => ({
  ClassesRepository: class ClassesRepository {
    async findByIdForUser(id: string, userId: string) {
      return (
        state.classes.find(
          (record) =>
            record.id === id && record.user_id === userId && record.deleted_at === null,
        ) ?? null
      );
    }

    async findByIdIncludingDeletedForUser(id: string, userId: string) {
      return state.classes.find((record) => record.id === id && record.user_id === userId) ?? null;
    }

    async existsForOtherUser(id: string, userId: string) {
      return state.classes.some(
        (record) =>
          record.id === id && record.user_id !== userId && record.deleted_at === null,
      );
    }

    async existsForOtherUserIncludingDeleted(id: string, userId: string) {
      return state.classes.some((record) => record.id === id && record.user_id !== userId);
    }

    async updateForUser(id: string, userId: string, changes: Record<string, unknown>) {
      const index = state.classes.findIndex(
        (record) =>
          record.id === id && record.user_id === userId && record.deleted_at === null,
      );

      if (index === -1) {
        return null;
      }

      state.classes[index] = {
        ...state.classes[index],
        ...changes,
      };

      return state.classes[index];
    }

    async softDeleteForUser(id: string, userId: string, deletedAt: string) {
      const index = state.classes.findIndex(
        (record) =>
          record.id === id && record.user_id === userId && record.deleted_at === null,
      );

      if (index === -1) {
        return false;
      }

      state.classes[index] = {
        ...state.classes[index],
        deleted_at: deletedAt,
      };

      return true;
    }

    async upsert(record: Record<string, unknown>) {
      const index = state.classes.findIndex((entry) => entry.id === record.id);

      if (index === -1) {
        state.classes.push(record);
        return record;
      }

      state.classes[index] = {
        ...state.classes[index],
        ...record,
      };

      return state.classes[index];
    }
  },
}));

vi.mock("../src/repositories/assignments.repository.js", () => ({
  AssignmentsRepository: class AssignmentsRepository {
    async findByIdIncludingDeletedForUser(id: string, userId: string) {
      return (
        state.assignments.find((record) => record.id === id && record.user_id === userId) ?? null
      );
    }

    async existsForOtherUserIncludingDeleted(id: string, userId: string) {
      return state.assignments.some((record) => record.id === id && record.user_id !== userId);
    }

    async upsert(record: Record<string, unknown>) {
      const index = state.assignments.findIndex((entry) => entry.id === record.id);

      if (index === -1) {
        state.assignments.push(record);
        return record;
      }

      state.assignments[index] = {
        ...state.assignments[index],
        ...record,
      };

      return state.assignments[index];
    }
  },
}));

vi.mock("../src/repositories/exams.repository.js", () => ({
  ExamsRepository: class ExamsRepository {},
}));

vi.mock("../src/repositories/expenses.repository.js", () => ({
  ExpensesRepository: class ExpensesRepository {},
}));

vi.mock("../src/repositories/budgets.repository.js", () => ({
  BudgetsRepository: class BudgetsRepository {},
}));

import { app } from "../src/app.js";

function seedState() {
  state.classes = [
    {
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      user_id: "user-1",
      subject: "Calculus",
      room: "101",
      instructor: "Prof. Lee",
      day_of_week: "monday",
      start_time: "08:00",
      end_time: "09:00",
      color: null,
      is_active: true,
      created_at: "2026-06-01T08:00:00.000Z",
      updated_at: "2026-06-06T09:00:00.000Z",
      deleted_at: null,
    },
  ];
  state.assignments = [];
}

beforeEach(() => {
  seedState();
});

describe("sync endpoints", () => {
  it("rejects unauthenticated sync push requests", async () => {
    const response = await app.request("http://localhost/api/sync/push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ items: [] }),
    });

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      error: {
        code: "UNAUTHENTICATED",
        message: "Missing bearer token.",
      },
    });
  });

  it("processes authenticated mixed batches and overwrites payload user_id", async () => {
    const response = await app.request("http://localhost/api/sync/push", {
      method: "POST",
      headers: {
        Authorization: "Bearer valid-token",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items: [
          {
            id: "11111111-1111-4111-8111-111111111111",
            entity_type: "assignment",
            entity_id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
            operation: "create",
            payload: {
              user_id: "user-2",
              title: "Offline assignment",
              due_date: "2026-06-10T08:00:00.000Z",
              created_at: "2026-06-05T08:00:00.000Z",
              updated_at: "2026-06-06T08:00:00.000Z",
            },
          },
          {
            id: "22222222-2222-4222-8222-222222222222",
            entity_type: "class",
            entity_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
            operation: "update",
            payload: {
              subject: "Older Calculus",
              updated_at: "2026-06-05T08:00:00.000Z",
            },
          },
          {
            id: "33333333-3333-4333-8333-333333333333",
            entity_type: "expense",
            entity_id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
            operation: "update",
            payload: {
              updated_at: "2026-06-06T08:30:00.000Z",
            },
          },
        ],
      }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      synced: [
        "11111111-1111-4111-8111-111111111111",
        "22222222-2222-4222-8222-222222222222",
      ],
      failed: ["33333333-3333-4333-8333-333333333333"],
    });
    expect(state.assignments).toHaveLength(1);
    expect(state.assignments[0]).toMatchObject({
      id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      user_id: "user-1",
      title: "Offline assignment",
      status: "pending",
      priority: 1,
      deleted_at: null,
    });
    expect(state.classes[0]).toMatchObject({
      subject: "Calculus",
      updated_at: "2026-06-06T09:00:00.000Z",
    });
  });
});

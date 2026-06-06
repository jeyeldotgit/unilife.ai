import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  budgets: [] as Record<string, unknown>[],
  expenses: [] as Record<string, unknown>[],
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

        if (token === "other-token") {
          return {
            data: { user: { id: "user-2" } },
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

vi.mock("../src/repositories/expenses.repository.js", () => ({
  ExpensesRepository: class ExpensesRepository {
    async listForUser(
      userId: string,
      filters: { since?: string; from?: string; to?: string; category?: string },
    ) {
      return state.expenses.filter((record) => {
        if (record.user_id !== userId || record.deleted_at !== null) {
          return false;
        }

        if (filters.since && Date.parse(String(record.updated_at)) <= Date.parse(filters.since)) {
          return false;
        }

        if (filters.from) {
          const fromBoundary = Date.parse(`${filters.from}T00:00:00.000Z`);
          if (Date.parse(String(record.spent_at)) < fromBoundary) {
            return false;
          }
        }

        if (filters.to) {
          const toBoundary = Date.parse(`${filters.to}T23:59:59.999Z`);
          if (Date.parse(String(record.spent_at)) > toBoundary) {
            return false;
          }
        }

        if (filters.category && record.category !== filters.category) {
          return false;
        }

        return true;
      });
    }

    async findByIdForUser(id: string, userId: string) {
      return (
        state.expenses.find(
          (record) =>
            record.id === id && record.user_id === userId && record.deleted_at === null,
        ) ?? null
      );
    }

    async existsForOtherUser(id: string, userId: string) {
      return state.expenses.some(
        (record) =>
          record.id === id && record.user_id !== userId && record.deleted_at === null,
      );
    }

    async create(record: Record<string, unknown>) {
      state.expenses.push(record);
      return record;
    }

    async softDeleteForUser(id: string, userId: string, deletedAt: string) {
      const index = state.expenses.findIndex(
        (record) =>
          record.id === id && record.user_id === userId && record.deleted_at === null,
      );

      if (index === -1) {
        return false;
      }

      state.expenses[index] = {
        ...state.expenses[index],
        deleted_at: deletedAt,
      };

      return true;
    }
  },
}));

vi.mock("../src/repositories/budgets.repository.js", () => ({
  BudgetsRepository: class BudgetsRepository {
    async listForUser(userId: string, filters: { since?: string }) {
      return state.budgets
        .filter((record) => {
          if (record.user_id !== userId) {
            return false;
          }

          if (!filters.since) {
            return true;
          }

          return Date.parse(String(record.updated_at)) > Date.parse(filters.since);
        })
        .sort((left, right) => String(right.start_date).localeCompare(String(left.start_date)));
    }

    async findByIdForUser(id: string, userId: string) {
      return state.budgets.find((record) => record.id === id && record.user_id === userId) ?? null;
    }

    async existsForOtherUser(id: string, userId: string) {
      return state.budgets.some((record) => record.id === id && record.user_id !== userId);
    }

    async create(record: Record<string, unknown>) {
      state.budgets.push(record);
      return record;
    }

    async updateForUser(id: string, userId: string, changes: Record<string, unknown>) {
      const index = state.budgets.findIndex(
        (record) => record.id === id && record.user_id === userId,
      );

      if (index === -1) {
        return null;
      }

      state.budgets[index] = {
        ...state.budgets[index],
        ...changes,
      };

      return state.budgets[index];
    }
  },
}));

import { app } from "../src/app.js";

function seedState() {
  state.expenses = [
    {
      id: "11111111-1111-4111-8111-111111111111",
      user_id: "user-1",
      budget_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      amount: 75,
      category: "food",
      description: "Snacks",
      spent_at: "2026-06-05T20:00:00.000Z",
      created_at: "2026-06-05T20:00:00.000Z",
      updated_at: "2026-06-05T20:00:00.000Z",
      deleted_at: null,
    },
    {
      id: "22222222-2222-4222-8222-222222222222",
      user_id: "user-1",
      budget_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      amount: 45,
      category: "transportation",
      description: "Ride home",
      spent_at: "2026-06-05T12:00:00.000Z",
      created_at: "2026-06-05T12:00:00.000Z",
      updated_at: "2026-06-05T12:00:00.000Z",
      deleted_at: null,
    },
    {
      id: "33333333-3333-4333-8333-333333333333",
      user_id: "user-1",
      budget_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      amount: 25,
      category: "food",
      description: "Breakfast",
      spent_at: "2026-06-04T23:59:59.000Z",
      created_at: "2026-06-04T23:59:59.000Z",
      updated_at: "2026-06-04T23:59:59.000Z",
      deleted_at: null,
    },
    {
      id: "44444444-4444-4444-8444-444444444444",
      user_id: "user-1",
      budget_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      amount: 30,
      category: "food",
      description: "Deleted meal",
      spent_at: "2026-06-05T10:00:00.000Z",
      created_at: "2026-06-05T10:00:00.000Z",
      updated_at: "2026-06-05T10:00:00.000Z",
      deleted_at: "2026-06-05T11:00:00.000Z",
    },
    {
      id: "55555555-5555-4555-8555-555555555555",
      user_id: "user-2",
      budget_id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      amount: 90,
      category: "food",
      description: "Foreign expense",
      spent_at: "2026-06-05T18:00:00.000Z",
      created_at: "2026-06-05T18:00:00.000Z",
      updated_at: "2026-06-05T18:00:00.000Z",
      deleted_at: null,
    },
  ];

  state.budgets = [
    {
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      user_id: "user-1",
      amount: 1500,
      period: "monthly",
      start_date: "2026-06-01",
      end_date: "2026-06-30",
      created_at: "2026-06-01T00:00:00.000Z",
      updated_at: "2026-06-02T00:00:00.000Z",
    },
    {
      id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      user_id: "user-1",
      amount: 500,
      period: "weekly",
      start_date: "2026-06-15",
      end_date: "2026-06-21",
      created_at: "2026-06-15T00:00:00.000Z",
      updated_at: "2026-06-15T00:00:00.000Z",
    },
    {
      id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
      user_id: "user-2",
      amount: 900,
      period: "monthly",
      start_date: "2026-06-01",
      end_date: "2026-06-30",
      created_at: "2026-06-01T00:00:00.000Z",
      updated_at: "2026-06-10T00:00:00.000Z",
    },
  ];
}

beforeEach(() => {
  seedState();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("finance endpoints", () => {
  it("rejects unauthenticated requests across finance route groups", async () => {
    const expensesResponse = await app.request("http://localhost/api/expenses");
    const budgetsResponse = await app.request("http://localhost/api/budgets");

    expect(expensesResponse.status).toBe(401);
    expect(budgetsResponse.status).toBe(401);
  });

  it("lists filtered expenses, returns totals, creates defaults, and soft deletes owned records", async () => {
    const listResponse = await app.request(
      "http://localhost/api/expenses?since=2026-06-05T00:00:00.000Z&from=2026-06-05&to=2026-06-05&category=food",
      {
        headers: {
          Authorization: "Bearer valid-token",
        },
      },
    );
    const listBody = await listResponse.json();

    expect(listResponse.status).toBe(200);
    expect(listBody.expenses).toHaveLength(1);
    expect(listBody.expenses[0].id).toBe("11111111-1111-4111-8111-111111111111");
    expect(listBody.total).toBe(75);

    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-06T08:00:00.000Z"));

    const createResponse = await app.request("http://localhost/api/expenses", {
      method: "POST",
      headers: {
        Authorization: "Bearer valid-token",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: "66666666-6666-4666-8666-666666666666",
        amount: 120.25,
        category: "school",
        created_at: "2026-06-06T07:00:00.000Z",
        updated_at: "2026-06-06T07:00:00.000Z",
      }),
    });
    const createBody = await createResponse.json();

    expect(createResponse.status).toBe(201);
    expect(createBody.expense.user_id).toBe("user-1");
    expect(createBody.expense.spent_at).toBe("2026-06-06T08:00:00.000Z");
    expect(createBody.expense.description).toBeNull();
    expect(createBody.expense.budget_id).toBeNull();

    vi.useRealTimers();

    const deleteResponse = await app.request(
      "http://localhost/api/expenses/66666666-6666-4666-8666-666666666666",
      {
        method: "DELETE",
        headers: {
          Authorization: "Bearer valid-token",
        },
      },
    );
    const deleteBody = await deleteResponse.json();

    expect(deleteResponse.status).toBe(200);
    expect(deleteBody).toEqual({ ok: true });
    expect(
      state.expenses.find((record) => record.id === "66666666-6666-4666-8666-666666666666")
        ?.deleted_at,
    ).not.toBeNull();
  });

  it("returns 403 for foreign expense deletes and 404 for missing expense deletes", async () => {
    const foreignDeleteResponse = await app.request(
      "http://localhost/api/expenses/55555555-5555-4555-8555-555555555555",
      {
        method: "DELETE",
        headers: {
          Authorization: "Bearer valid-token",
        },
      },
    );
    const foreignDeleteBody = await foreignDeleteResponse.json();

    expect(foreignDeleteResponse.status).toBe(403);
    expect(foreignDeleteBody.error.code).toBe("FORBIDDEN");

    const missingDeleteResponse = await app.request(
      "http://localhost/api/expenses/77777777-7777-4777-8777-777777777777",
      {
        method: "DELETE",
        headers: {
          Authorization: "Bearer valid-token",
        },
      },
    );
    const missingDeleteBody = await missingDeleteResponse.json();

    expect(missingDeleteResponse.status).toBe(404);
    expect(missingDeleteBody.error.code).toBe("NOT_FOUND");
  });

  it("lists budgets in descending start-date order, injects user_id on create, and returns null on stale updates", async () => {
    const listResponse = await app.request(
      "http://localhost/api/budgets?since=2026-06-01T00:00:00.000Z",
      {
        headers: {
          Authorization: "Bearer valid-token",
        },
      },
    );
    const listBody = await listResponse.json();

    expect(listResponse.status).toBe(200);
    expect(listBody.budgets).toHaveLength(2);
    expect(listBody.budgets[0].id).toBe("bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb");
    expect(listBody.budgets[1].id).toBe("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa");

    const createResponse = await app.request("http://localhost/api/budgets", {
      method: "POST",
      headers: {
        Authorization: "Bearer valid-token",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
        amount: 1800,
        period: "monthly",
        start_date: "2026-07-01",
        end_date: "2026-07-31",
        created_at: "2026-07-01T00:00:00.000Z",
        updated_at: "2026-07-01T00:00:00.000Z",
      }),
    });
    const createBody = await createResponse.json();

    expect(createResponse.status).toBe(201);
    expect(createBody.budget.user_id).toBe("user-1");

    const updateResponse = await app.request(
      "http://localhost/api/budgets/dddddddd-dddd-4ddd-8ddd-dddddddddddd",
      {
        method: "PATCH",
        headers: {
          Authorization: "Bearer valid-token",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: 1900,
          end_date: "2026-08-01",
          updated_at: "2026-07-02T00:00:00.000Z",
        }),
      },
    );
    const updateBody = await updateResponse.json();

    expect(updateResponse.status).toBe(200);
    expect(updateBody.budget.amount).toBe(1900);
    expect(updateBody.budget.end_date).toBe("2026-08-01");

    const staleResponse = await app.request(
      "http://localhost/api/budgets/dddddddd-dddd-4ddd-8ddd-dddddddddddd",
      {
        method: "PATCH",
        headers: {
          Authorization: "Bearer valid-token",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: 1950,
          updated_at: "2026-07-01T12:00:00.000Z",
        }),
      },
    );
    const staleBody = await staleResponse.json();

    expect(staleResponse.status).toBe(200);
    expect(staleBody.budget).toBeNull();
  });

  it("returns 403 for foreign budget updates and 404 for missing budget updates", async () => {
    const foreignUpdateResponse = await app.request(
      "http://localhost/api/budgets/cccccccc-cccc-4ccc-8ccc-cccccccccccc",
      {
        method: "PATCH",
        headers: {
          Authorization: "Bearer valid-token",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: 950,
          updated_at: "2026-06-11T00:00:00.000Z",
        }),
      },
    );
    const foreignUpdateBody = await foreignUpdateResponse.json();

    expect(foreignUpdateResponse.status).toBe(403);
    expect(foreignUpdateBody.error.code).toBe("FORBIDDEN");

    const missingUpdateResponse = await app.request(
      "http://localhost/api/budgets/eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
      {
        method: "PATCH",
        headers: {
          Authorization: "Bearer valid-token",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: 950,
          updated_at: "2026-06-11T00:00:00.000Z",
        }),
      },
    );
    const missingUpdateBody = await missingUpdateResponse.json();

    expect(missingUpdateResponse.status).toBe(404);
    expect(missingUpdateBody.error.code).toBe("NOT_FOUND");
  });
});

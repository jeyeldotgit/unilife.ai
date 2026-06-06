import { afterEach, describe, expect, it, vi } from "vitest";

import { BudgetsService } from "../src/services/budgets.service.js";
import { ExpensesService } from "../src/services/expenses.service.js";

afterEach(() => {
  vi.useRealTimers();
});

describe("finance services", () => {
  it("injects expense defaults and the authenticated user on create", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-06T08:00:00.000Z"));

    const create = vi.fn(async (record) => record);
    const service = new ExpensesService(
      {} as never,
      "user-1",
      {
        create,
      } as never,
    );

    const record = await service.createExpense({
      id: "11111111-1111-4111-8111-111111111111",
      amount: 149.75,
      category: "food",
      created_at: "2026-06-05T08:00:00.000Z",
      updated_at: "2026-06-05T08:00:00.000Z",
    });

    expect(create).toHaveBeenCalledWith({
      id: "11111111-1111-4111-8111-111111111111",
      user_id: "user-1",
      budget_id: null,
      amount: 149.75,
      category: "food",
      description: null,
      spent_at: "2026-06-06T08:00:00.000Z",
      created_at: "2026-06-05T08:00:00.000Z",
      updated_at: "2026-06-05T08:00:00.000Z",
      deleted_at: null,
    });
    expect(record.user_id).toBe("user-1");
    expect(record.spent_at).toBe("2026-06-06T08:00:00.000Z");
  });

  it("returns filtered expenses with the computed total", async () => {
    const listForUser = vi.fn(async () => [
      {
        id: "expense-1",
        user_id: "user-1",
        budget_id: null,
        amount: 120.5,
        category: "food",
        description: null,
        spent_at: "2026-06-05T08:00:00.000Z",
        created_at: "2026-06-05T08:00:00.000Z",
        updated_at: "2026-06-05T08:00:00.000Z",
        deleted_at: null,
      },
      {
        id: "expense-2",
        user_id: "user-1",
        budget_id: null,
        amount: 29.5,
        category: "food",
        description: null,
        spent_at: "2026-06-05T12:00:00.000Z",
        created_at: "2026-06-05T12:00:00.000Z",
        updated_at: "2026-06-05T12:00:00.000Z",
        deleted_at: null,
      },
    ]);
    const service = new ExpensesService(
      {} as never,
      "user-1",
      {
        listForUser,
      } as never,
    );

    const result = await service.listForUser({
      since: "2026-06-04T00:00:00.000Z",
      from: "2026-06-05",
      to: "2026-06-05",
      category: "food",
    });

    expect(listForUser).toHaveBeenCalledWith("user-1", {
      since: "2026-06-04T00:00:00.000Z",
      from: "2026-06-05",
      to: "2026-06-05",
      category: "food",
    });
    expect(result).toEqual({
      expenses: expect.any(Array),
      total: 150,
    });
  });

  it("rejects stale budget updates without writing", async () => {
    const updateForUser = vi.fn();
    const service = new BudgetsService(
      {} as never,
      "user-1",
      {
        existsForOtherUser: vi.fn(),
        findByIdForUser: vi.fn(async () => ({
          id: "budget-1",
          user_id: "user-1",
          amount: 1500,
          period: "monthly",
          start_date: "2026-06-01",
          end_date: "2026-06-30",
          created_at: "2026-06-01T00:00:00.000Z",
          updated_at: "2026-06-05T08:00:00.000Z",
        })),
        updateForUser,
      } as never,
    );

    const result = await service.updateBudget("budget-1", {
      amount: 1600,
      updated_at: "2026-06-04T08:00:00.000Z",
    });

    expect(result).toEqual({ status: "stale" });
    expect(updateForUser).not.toHaveBeenCalled();
  });
});

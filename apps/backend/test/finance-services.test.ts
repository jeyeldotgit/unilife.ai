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
      refund_of_expense_id: null,
      amount: 149.75,
      category: "food",
      description: null,
      spent_at: "2026-06-06T08:00:00.000Z",
      recurrence: null,
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

  it("creates partial refunds against the original expense and rejects excessive refunds", async () => {
    const original = {
      id: "11111111-1111-4111-8111-111111111111",
      user_id: "user-1",
      budget_id: "budget-1",
      refund_of_expense_id: null,
      amount: 100,
      category: "food" as const,
      description: "Lunch",
      spent_at: "2026-06-15T04:00:00.000Z",
      recurrence: null,
      created_at: "2026-06-15T04:00:00.000Z",
      updated_at: "2026-06-15T04:00:00.000Z",
      deleted_at: null,
    };
    const create = vi.fn(async (record) => record);
    const service = new ExpensesService(
      {} as never,
      "user-1",
      {
        create,
        existsForOtherUser: vi.fn(async () => false),
        findByIdForUser: vi.fn(async () => original),
        getActiveRefundTotal: vi.fn(async () => -25),
      } as never,
    );

    const refund = await service.createExpense({
      id: "22222222-2222-4222-8222-222222222222",
      refund_of_expense_id: original.id,
      amount: -50,
      category: "miscellaneous",
      created_at: "2026-06-15T05:00:00.000Z",
      updated_at: "2026-06-15T05:00:00.000Z",
    });
    expect(refund.budget_id).toBe("budget-1");
    expect(refund.category).toBe("food");

    await expect(
      service.createExpense({
        id: "33333333-3333-4333-8333-333333333333",
        refund_of_expense_id: original.id,
        amount: -80,
        category: "food",
        created_at: "2026-06-15T05:00:00.000Z",
        updated_at: "2026-06-15T05:00:00.000Z",
      }),
    ).rejects.toThrow("remaining refundable amount");
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
      mutation_id: "22222222-2222-4222-8222-222222222222",
    });

    expect(result).toEqual({ status: "stale" });
    expect(updateForUser).not.toHaveBeenCalled();
  });
});

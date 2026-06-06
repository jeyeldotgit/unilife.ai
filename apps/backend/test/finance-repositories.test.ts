import { describe, expect, it, vi } from "vitest";

import { BudgetsRepository } from "../src/repositories/budgets.repository.js";
import { ExpensesRepository } from "../src/repositories/expenses.repository.js";

function createQueryBuilder(result: unknown, singleResult = result) {
  const builder = {
    eq: vi.fn(() => builder),
    gt: vi.fn(() => builder),
    gte: vi.fn(() => builder),
    insert: vi.fn(() => builder),
    is: vi.fn(() => builder),
    lte: vi.fn(() => builder),
    neq: vi.fn(() => builder),
    order: vi.fn(() => builder),
    select: vi.fn(() => builder),
    single: vi.fn(async () => singleResult),
    then: (onFulfilled: (value: unknown) => unknown, onRejected?: (reason: unknown) => unknown) =>
      Promise.resolve(result).then(onFulfilled, onRejected),
    update: vi.fn(() => builder),
  };

  return builder;
}

describe("finance repositories", () => {
  it("applies combined expense filters, excludes soft-deleted rows, and normalizes amounts", async () => {
    const builder = createQueryBuilder({
      data: [
        {
          id: "expense-1",
          user_id: "user-1",
          budget_id: null,
          amount: "149.75",
          category: "food",
          description: null,
          spent_at: "2026-06-05T08:00:00.000Z",
          created_at: "2026-06-05T08:00:00.000Z",
          updated_at: "2026-06-05T08:00:00.000Z",
          deleted_at: null,
        },
      ],
      error: null,
    });
    const repository = new ExpensesRepository({
      from: vi.fn(() => builder),
    } as never);

    const result = await repository.listForUser("user-1", {
      since: "2026-06-04T00:00:00.000Z",
      from: "2026-06-05",
      to: "2026-06-05",
      category: "food",
    });

    expect(result).toEqual([
      expect.objectContaining({
        amount: 149.75,
      }),
    ]);
    expect(builder.eq).toHaveBeenNthCalledWith(1, "user_id", "user-1");
    expect(builder.eq).toHaveBeenNthCalledWith(2, "category", "food");
    expect(builder.is).toHaveBeenCalledWith("deleted_at", null);
    expect(builder.gt).toHaveBeenCalledWith("updated_at", "2026-06-04T00:00:00.000Z");
    expect(builder.gte).toHaveBeenCalledWith("spent_at", "2026-06-05T00:00:00.000Z");
    expect(builder.lte).toHaveBeenCalledWith("spent_at", "2026-06-05T23:59:59.999Z");
  });

  it("scopes expense soft deletes to owned, non-deleted rows", async () => {
    const builder = createQueryBuilder(
      { data: null, error: null },
      {
        data: { id: "expense-1" },
        error: null,
      },
    );
    const repository = new ExpensesRepository({
      from: vi.fn(() => builder),
    } as never);

    const result = await repository.softDeleteForUser(
      "expense-1",
      "user-1",
      "2026-06-06T08:00:00.000Z",
    );

    expect(result).toBe(true);
    expect(builder.update).toHaveBeenCalledWith({
      deleted_at: "2026-06-06T08:00:00.000Z",
    });
    expect(builder.eq).toHaveBeenNthCalledWith(1, "id", "expense-1");
    expect(builder.eq).toHaveBeenNthCalledWith(2, "user_id", "user-1");
    expect(builder.is).toHaveBeenCalledWith("deleted_at", null);
  });

  it("orders budgets by start date descending, applies since, and normalizes amounts", async () => {
    const builder = createQueryBuilder({
      data: [
        {
          id: "budget-2",
          user_id: "user-1",
          amount: "2000.00",
          period: "monthly",
          start_date: "2026-06-15",
          end_date: "2026-07-14",
          created_at: "2026-06-15T00:00:00.000Z",
          updated_at: "2026-06-15T00:00:00.000Z",
        },
      ],
      error: null,
    });
    const repository = new BudgetsRepository({
      from: vi.fn(() => builder),
    } as never);

    const result = await repository.listForUser("user-1", {
      since: "2026-06-01T00:00:00.000Z",
    });

    expect(result).toEqual([
      expect.objectContaining({
        amount: 2000,
      }),
    ]);
    expect(builder.eq).toHaveBeenCalledWith("user_id", "user-1");
    expect(builder.gt).toHaveBeenCalledWith("updated_at", "2026-06-01T00:00:00.000Z");
    expect(builder.order).toHaveBeenCalledWith("start_date", { ascending: false });
  });
});

import { describe, expect, it } from "vitest";

import { buildBudgetStatusSnapshot } from "@/lib/api/budget";
import { buildExpensesSnapshot, normalizeExpenseRecord } from "@/lib/api/expenses";

describe("finance adapters", () => {
  it("normalizes expense records and preserves the display label from description", () => {
    const expense = normalizeExpenseRecord({
      id: "expense-1",
      user_id: "user-1",
      budget_id: "budget-1",
      amount: 85,
      category: "food",
      description: "lunch",
      spent_at: "2026-06-08T12:30:00.000Z",
      created_at: "2026-06-08T12:30:00.000Z",
      updated_at: "2026-06-08T12:30:00.000Z",
      deleted_at: null,
    });

    expect(expense).toMatchObject({
      label: "Lunch",
      category: "food",
      amount: 85,
    });
  });

  it("builds budget and expense snapshots from backend records", () => {
    const expensesSnapshot = buildExpensesSnapshot([
      {
        id: "expense-1",
        user_id: "user-1",
        budget_id: "budget-1",
        amount: 85,
        category: "food",
        description: "Lunch",
        spent_at: "2026-06-08T12:30:00.000Z",
        created_at: "2026-06-08T12:30:00.000Z",
        updated_at: "2026-06-08T12:30:00.000Z",
        deleted_at: null,
      },
      {
        id: "expense-2",
        user_id: "user-1",
        budget_id: "budget-1",
        amount: 50,
        category: "transportation",
        description: "Fare",
        spent_at: "2026-06-08T08:15:00.000Z",
        created_at: "2026-06-08T08:15:00.000Z",
        updated_at: "2026-06-08T08:15:00.000Z",
        deleted_at: null,
      },
    ]);
    const budgetStatus = buildBudgetStatusSnapshot(
      {
        id: "budget-1",
        amount: 500,
        period: "weekly",
        start_date: "2026-06-02",
        end_date: "2099-06-08",
      },
      [
        { amount: 85 },
        { amount: 50 },
      ],
    );

    expect(expensesSnapshot.categoryTotals.find((item) => item.category === "food"))
      .toMatchObject({
        amount: 85,
      });
    expect(budgetStatus).toMatchObject({
      totalAmount: 500,
      spentAmount: 135,
      period: "weekly",
    });
  });
});

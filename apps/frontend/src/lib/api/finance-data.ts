import type { Budget, Expense, ExpenseCategory } from "@unilife-ai/types";

import { requestBackend } from "@/lib/api/client";
import { getLocalDateKey } from "@/lib/api/utils";

type ListBudgetsResponse = {
  budgets: Budget[];
};

type ListExpensesResponse = {
  expenses: Expense[];
  total: number;
};

export async function listBudgetRecords() {
  const response = await requestBackend<ListBudgetsResponse>("/api/budgets");
  return response.budgets;
}

export async function listExpenseRecords(filters?: {
  category?: ExpenseCategory;
  from?: string;
  to?: string;
  from_at?: string;
  to_at?: string;
}) {
  const response = await requestBackend<ListExpensesResponse>("/api/expenses", {
    query: filters,
  });

  return response.expenses;
}

export function findActiveBudget(budgets: Budget[], today = getLocalDateKey()) {
  const activeBudgets = budgets
    .filter((budget) => budget.start_date <= today && budget.end_date >= today)
    .sort((left, right) => right.start_date.localeCompare(left.start_date));

  return activeBudgets[0] ?? null;
}

export async function getFinanceSnapshot() {
  const budgets = await listBudgetRecords();
  const activeBudget = findActiveBudget(budgets);
  const expenses = await listExpenseRecords(
    activeBudget
      ? {
          from: activeBudget.start_date,
          to: activeBudget.end_date,
        }
      : undefined,
  );

  return {
    budgets,
    activeBudget,
    expenses,
  };
}

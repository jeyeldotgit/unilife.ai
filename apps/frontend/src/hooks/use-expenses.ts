"use client";

import { db } from "@/lib/db/dexie";
import { getCurrentUserId } from "@/lib/session/current-user";
import {
  buildBudgetStatusSnapshot,
  buildExpensesSnapshot,
  findActiveBudget,
} from "@/lib/selectors/finance";
import { useLiveQueryValue } from "@/hooks/use-live-query";
import { useSyncStatus } from "@/hooks/use-sync-status";

export function useExpenses() {
  const syncStatus = useSyncStatus();
  const userId = getCurrentUserId();
  const budgetsQuery = useLiveQueryValue(
    async () => {
      if (!userId) {
        return [];
      }

      return db.budgets.where("user_id").equals(userId).toArray();
    },
    [],
  );
  const expensesQuery = useLiveQueryValue(
    async () => {
      if (!userId) {
        return [];
      }

      return db.expenses
        .where("user_id")
        .equals(userId)
        .and((record) => record.deleted_at === null)
        .toArray();
    },
    [],
  );
  const activeBudget = findActiveBudget(budgetsQuery.value);
  const filteredExpenses = activeBudget
    ? expensesQuery.value.filter(
        (expense) =>
          expense.spent_at >= `${activeBudget.start_date}T00:00:00` &&
          expense.spent_at <= `${activeBudget.end_date}T23:59:59.999`,
      )
    : expensesQuery.value;
  const expensesSnapshot = buildExpensesSnapshot(filteredExpenses);

  return {
    activeBudget,
    available: syncStatus.ready || expensesQuery.value.length > 0,
    budgetAvailable: syncStatus.ready || budgetsQuery.value.length > 0,
    budgetStatus: activeBudget
      ? buildBudgetStatusSnapshot(activeBudget, filteredExpenses)
      : null,
    budgets: budgetsQuery.value,
    expenses: expensesQuery.value,
    loaded: budgetsQuery.loaded && expensesQuery.loaded,
    snapshot: expensesSnapshot,
  };
}

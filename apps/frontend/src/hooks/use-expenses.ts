"use client";

import { db } from "@/lib/db/dexie";
import {
  buildBudgetStatusSnapshot,
  buildExpensesSnapshot,
  findActiveBudget,
} from "@/lib/selectors/finance";
import { useCurrentUserId } from "@/hooks/use-current-user-id";
import { useLiveQueryValue } from "@/hooks/use-live-query";
import { useSyncStatus } from "@/hooks/use-sync-status";

export function useExpenses() {
  const syncStatus = useSyncStatus();
  const userId = useCurrentUserId();
  const budgetsQuery = useLiveQueryValue(
    async () => {
      if (!userId) {
        return [];
      }

      return db.budgets.where("user_id").equals(userId).toArray();
    },
    [],
    [userId],
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
    [userId],
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

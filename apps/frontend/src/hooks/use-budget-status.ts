"use client";

import { useExpenses } from "@/hooks/use-expenses";

export function useBudgetStatus() {
  const { budgetAvailable, budgetStatus, loaded } = useExpenses();

  return {
    available: budgetAvailable,
    budgetStatus,
    loaded,
  };
}

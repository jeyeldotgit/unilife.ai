import type { BudgetCycle } from "@/lib/types";

const budgetCycle: BudgetCycle = {
  id: "budget-weekly-1",
  period: "weekly",
  amount: 1500,
  startDate: "2026-06-02",
  endDate: "2026-06-08",
};

const estimatedDailySpend = 85;

export function getMockBudgetCycle() {
  return budgetCycle;
}

export function getMockEstimatedDailySpend() {
  return estimatedDailySpend;
}

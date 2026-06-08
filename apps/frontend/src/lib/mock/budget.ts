import type { BudgetCycle, OnboardingBudgetInput } from "@/lib/types";

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

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function toDateLabel(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function updateMockBudgetCycle(input: OnboardingBudgetInput) {
  const startDate = new Date();
  const endDate =
    input.period === "weekly"
      ? addDays(startDate, 6)
      : input.period === "biweekly"
        ? addDays(startDate, 13)
        : addDays(startDate, 29);

  budgetCycle.period = input.period;
  budgetCycle.amount = input.amount;
  budgetCycle.startDate = toDateLabel(startDate);
  budgetCycle.endDate = toDateLabel(endDate);

  return budgetCycle;
}

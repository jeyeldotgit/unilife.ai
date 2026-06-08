import type {
  ApiRequestOptions,
  BudgetStatus,
  OnboardingBudgetInput,
} from "@/lib/types";
import {
  getMockBudgetCycle,
  getMockEstimatedDailySpend,
  updateMockBudgetCycle,
} from "@/lib/mock/budget";
import { listMockExpenses } from "@/lib/mock/expenses";
import { withMockLatency } from "@/lib/api/_mock";

function formatAmount(amount: number) {
  return `₱ ${amount.toLocaleString("en-PH", {
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

export function buildBudgetStatusSnapshot(): BudgetStatus {
  const cycle = getMockBudgetCycle();
  const spentAmount = listMockExpenses().reduce((sum, expense) => {
    return sum + expense.amount;
  }, 0);
  const remainingAmount = Math.max(cycle.amount - spentAmount, 0);
  const progressPercent =
    cycle.amount === 0 ? 0 : Math.round((spentAmount / cycle.amount) * 100);
  const estimatedDaysLeft = Math.max(
    0,
    Math.round(remainingAmount / getMockEstimatedDailySpend()),
  );
  const tone =
    remainingAmount <= cycle.amount * 0.15
      ? "danger"
      : remainingAmount <= cycle.amount * 0.35
        ? "warning"
        : "healthy";

  return {
    budgetId: cycle.id,
    period: cycle.period,
    cycleLabel:
      cycle.period === "weekly"
        ? "Weekly Budget"
        : cycle.period === "biweekly"
          ? "Bi-Weekly Budget"
          : "Monthly Budget",
    totalAmount: cycle.amount,
    spentAmount,
    remainingAmount,
    totalLabel: formatAmount(cycle.amount),
    spentLabel: formatAmount(spentAmount),
    remainingLabel: formatAmount(remainingAmount),
    progressPercent,
    progressLabel: `${progressPercent}% used`,
    estimatedDaysLeft,
    estimateLabel: `Est. lasts ${estimatedDaysLeft} more days`,
    tone,
  };
}

export async function getBudgetStatus(options?: ApiRequestOptions) {
  return withMockLatency(() => buildBudgetStatusSnapshot(), options);
}

export async function saveBudgetCycle(
  input: OnboardingBudgetInput,
  options?: ApiRequestOptions,
) {
  return withMockLatency(() => {
    updateMockBudgetCycle(input);
    return buildBudgetStatusSnapshot();
  }, options);
}

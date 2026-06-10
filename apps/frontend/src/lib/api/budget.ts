import type { Budget } from "@unilife-ai/types";

import { requestBackend } from "@/lib/api/client";
import { getFinanceSnapshot, listExpenseRecords, listBudgetRecords } from "@/lib/api/finance-data";
import {
  calculateBudgetEndDate,
  formatAmount,
  getBudgetCycleLabel,
  getLocalDateKey,
} from "@/lib/api/utils";
import type { BudgetStatus, OnboardingBudgetInput } from "@/lib/types";

type BudgetResponse = {
  budget: Budget | null;
};

function diffCalendarDaysInclusive(startDate: string, endDate: string) {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  const dayMs = 24 * 60 * 60 * 1000;

  return Math.max(
    1,
    Math.floor((end.getTime() - start.getTime()) / dayMs) + 1,
  );
}

function calculateAverageDailySpend(
  startDate: string,
  expenses: Array<{ amount: number }>,
) {
  const elapsedDays = diffCalendarDaysInclusive(startDate, getLocalDateKey());
  const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  return elapsedDays === 0 ? 0 : totalSpent / elapsedDays;
}

export function buildBudgetStatusSnapshot(
  cycle: Pick<Budget, "amount" | "end_date" | "id" | "period" | "start_date">,
  expenses: Array<{ amount: number }>,
): BudgetStatus {
  const spentAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const remainingAmount = Math.max(cycle.amount - spentAmount, 0);
  const progressPercent =
    cycle.amount === 0 ? 0 : Math.round((spentAmount / cycle.amount) * 100);
  const averageDailySpend = Math.max(
    calculateAverageDailySpend(cycle.start_date, expenses),
    1,
  );
  const estimatedDaysLeft = Math.max(
    0,
    Math.round(remainingAmount / averageDailySpend),
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
    cycleLabel: getBudgetCycleLabel(cycle.period),
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

export async function getBudgetStatus() {
  const { activeBudget, expenses } = await getFinanceSnapshot();

  if (!activeBudget) {
    return null;
  }

  return buildBudgetStatusSnapshot(activeBudget, expenses);
}

export async function getBudgetChatContext() {
  const { activeBudget, expenses } = await getFinanceSnapshot();

  if (!activeBudget) {
    return {
      avgDailySpend: null,
      budgetPeriodEndDate: null,
      budgetRemaining: null,
    };
  }

  const status = buildBudgetStatusSnapshot(activeBudget, expenses);

  return {
    avgDailySpend: Number(
      calculateAverageDailySpend(activeBudget.start_date, expenses).toFixed(2),
    ),
    budgetPeriodEndDate: activeBudget.end_date,
    budgetRemaining: status.remainingAmount,
  };
}

export async function saveBudgetCycle(
  input: OnboardingBudgetInput,
) {
  const budgets = await listBudgetRecords();
  const today = getLocalDateKey();
  const activeBudget =
    budgets
      .filter((budget) => budget.start_date <= today && budget.end_date >= today)
      .sort((left, right) => right.start_date.localeCompare(left.start_date))[0] ??
    null;

  if (activeBudget) {
    const response = await requestBackend<BudgetResponse>(
      `/api/budgets/${activeBudget.id}`,
      {
        method: "PATCH",
        body: {
          amount: input.amount,
          period: input.period,
          end_date: calculateBudgetEndDate(activeBudget.start_date, input.period),
          updated_at: new Date().toISOString(),
        },
      },
    );

    const updatedBudget = response.budget;
    if (!updatedBudget) {
      throw new Error("The backend did not return the updated budget.");
    }

    const expenses = await listExpenseRecords({
      from: updatedBudget.start_date,
      to: updatedBudget.end_date,
    });

    return buildBudgetStatusSnapshot(updatedBudget, expenses);
  }

  const createdAt = new Date().toISOString();
  const startDate = today;
  const response = await requestBackend<BudgetResponse>("/api/budgets", {
    method: "POST",
    body: {
      id: crypto.randomUUID(),
      amount: input.amount,
      period: input.period,
      start_date: startDate,
      end_date: calculateBudgetEndDate(startDate, input.period),
      created_at: createdAt,
      updated_at: createdAt,
    },
  });

  const createdBudget = response.budget;
  if (!createdBudget) {
    throw new Error("The backend did not return the created budget.");
  }

  return buildBudgetStatusSnapshot(createdBudget, []);
}

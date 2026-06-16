import type { Budget, Expense as ExpenseRecord, ExpenseCategory } from "@unilife-ai/types";

import {
  formatAmount,
  formatExpenseDayLabel,
  formatTimeLabel,
  getBudgetCycleLabel,
  getExpenseCategoryIcon,
  getExpenseCategoryLabel,
  getLocalDateKey,
  titleCase,
} from "@/lib/api/utils";
import type {
  BudgetStatus,
  ExpenseCategoryTotal,
  ExpenseDayGroup,
  ExpenseItem,
  ExpensesSnapshot,
} from "@/lib/types";

const categoryOrder: ExpenseCategory[] = [
  "food",
  "school",
  "transportation",
  "entertainment",
  "miscellaneous",
];

const categoryMeta: Record<
  ExpenseCategory,
  Omit<ExpenseCategoryTotal, "amount" | "amountLabel" | "percent">
> = {
  food: {
    category: "food",
    label: "Food",
    icon: "restaurant",
    iconColor: "text-[#3B82F6]",
  },
  school: {
    category: "school",
    label: "School",
    icon: "school",
    iconColor: "text-[#825100]",
  },
  transportation: {
    category: "transportation",
    label: "Transport",
    icon: "directions_bus",
    wide: true,
  },
  entertainment: {
    category: "entertainment",
    label: "Entertainment",
    icon: "stadia_controller",
  },
  miscellaneous: {
    category: "miscellaneous",
    label: "Misc",
    icon: "inventory_2",
  },
};

function fallbackExpenseLabel(category: ExpenseCategory) {
  return category === "food"
    ? "Food expense"
    : category === "school"
      ? "School expense"
      : category === "transportation"
        ? "Transport expense"
        : category === "entertainment"
          ? "Entertainment expense"
          : "Misc expense";
}

function sortByNewest(items: ExpenseItem[]) {
  return [...items].sort((left, right) => {
    return new Date(right.spentAt).getTime() - new Date(left.spentAt).getTime();
  });
}

function buildRecentGroups(items: ExpenseItem[]): ExpenseDayGroup[] {
  const recentItems = sortByNewest(items);
  const groupMap = new Map<string, ExpenseItem[]>();

  for (const item of recentItems) {
    const existing = groupMap.get(item.dayLabel);

    if (existing) {
      existing.push(item);
      continue;
    }

    groupMap.set(item.dayLabel, [item]);
  }

  return Array.from(groupMap.entries()).map(([day, expenses]) => ({
    day,
    expenses,
  }));
}

function buildCategoryTotals(items: ExpenseItem[]) {
  const totalSpent = items.reduce((sum, item) => sum + item.amount, 0);
  const totals = new Map<ExpenseCategory, number>();

  for (const category of categoryOrder) {
    totals.set(category, 0);
  }

  for (const item of items) {
    totals.set(item.category, (totals.get(item.category) ?? 0) + item.amount);
  }

  return categoryOrder.map((category) => {
    const amount = totals.get(category) ?? 0;
    const percent = totalSpent === 0 ? 0 : Math.round((amount / totalSpent) * 100);

    return {
      ...categoryMeta[category],
      amount,
      amountLabel: formatAmount(amount),
      percent,
    } satisfies ExpenseCategoryTotal;
  });
}

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

function diffCalendarDays(startDate: string, endDate: string) {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  return Math.floor((end.getTime() - start.getTime()) / 86_400_000);
}

function getBudgetEstimate(
  cycle: Pick<Budget, "end_date" | "start_date">,
  spentAmount: number,
  remainingAmount: number,
) {
  const today = getLocalDateKey();
  const daysElapsedInCycle = Math.max(1, diffCalendarDays(cycle.start_date, today) + 1);
  const daysRemainingInCycle = Math.max(0, diffCalendarDays(today, cycle.end_date));

  if (remainingAmount <= 0) {
    return { estimatedDaysLeft: 0, estimateLabel: "Over budget" };
  }

  if (spentAmount === 0 && daysElapsedInCycle <= 1) {
    return { estimatedDaysLeft: daysRemainingInCycle, estimateLabel: "Budget just started" };
  }

  if (spentAmount === 0) {
    return {
      estimatedDaysLeft: daysRemainingInCycle,
      estimateLabel: "No spending recorded yet",
    };
  }

  const averageDailySpend = calculateAverageDailySpend(cycle.start_date, [
    { amount: spentAmount },
  ]);
  const estimatedDaysLeft = Math.min(
    daysRemainingInCycle,
    Math.max(0, Math.floor(remainingAmount / averageDailySpend)),
  );

  return {
    estimatedDaysLeft,
    estimateLabel: `Est. lasts ${estimatedDaysLeft} more day${estimatedDaysLeft === 1 ? "" : "s"}`,
  };
}

export function normalizeExpenseRecord(record: ExpenseRecord): ExpenseItem {
  const label = record.description?.trim()
    ? titleCase(record.description.trim())
    : fallbackExpenseLabel(record.category);

  return {
    id: record.id,
    label,
    category: record.category,
    categoryLabel: getExpenseCategoryLabel(record.category),
    spentAt: record.spent_at,
    dayLabel: formatExpenseDayLabel(record.spent_at),
    timeLabel: formatTimeLabel(record.spent_at),
    amount: record.amount,
    amountLabel: formatAmount(record.amount),
    icon: getExpenseCategoryIcon(record.category),
    description: record.description,
    budgetId: record.budget_id,
    refundOfExpenseId: record.refund_of_expense_id ?? null,
    recurrence: record.recurrence ?? null,
  };
}

export function buildExpensesSnapshot(records: ExpenseRecord[]): ExpensesSnapshot {
  const items = records.map(normalizeExpenseRecord);

  return {
    items: sortByNewest(items),
    groups: buildRecentGroups(items),
    categoryTotals: buildCategoryTotals(items),
  };
}

export function findActiveBudget(
  budgets: Budget[],
  today = getLocalDateKey(),
) {
  const activeBudgets = budgets
    .filter((budget) => budget.start_date <= today && budget.end_date >= today)
    .sort((left, right) => right.start_date.localeCompare(left.start_date));

  return activeBudgets[0] ?? null;
}

export function buildBudgetStatusSnapshot(
  cycle: Pick<Budget, "amount" | "end_date" | "id" | "period" | "start_date">,
  expenses: Array<{ amount: number }>,
): BudgetStatus {
  const spentAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const rawRemainingAmount = cycle.amount - spentAmount;
  const remainingAmount = Math.max(rawRemainingAmount, 0);
  const progressPercent =
    cycle.amount === 0 ? 0 : Math.round((spentAmount / cycle.amount) * 100);
  const estimate = getBudgetEstimate(cycle, spentAmount, rawRemainingAmount);
  const tone =
    rawRemainingAmount <= 0 || remainingAmount <= cycle.amount * 0.15
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
    estimatedDaysLeft: estimate.estimatedDaysLeft,
    estimateLabel: estimate.estimateLabel,
    tone,
  };
}

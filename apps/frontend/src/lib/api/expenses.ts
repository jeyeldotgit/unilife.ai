import type {
  ApiRequestOptions,
  ExpenseCategory,
  ExpenseCategoryTotal,
  ExpenseDayGroup,
  ExpensesSnapshot,
  ExpenseItem,
  LogExpenseInput,
} from "@/lib/types";
import {
  appendMockExpense,
  listMockExpenses,
  removeMockExpense,
} from "@/lib/mock/expenses";
import { withMockLatency } from "@/lib/api/_mock";

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

function formatAmount(amount: number) {
  return `₱ ${amount.toLocaleString("en-PH", {
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

function sortByNewest(items: ExpenseItem[]) {
  return [...items].sort((left, right) => {
    return new Date(right.spentAt).getTime() - new Date(left.spentAt).getTime();
  });
}

function buildRecentGroups(items: ExpenseItem[]): ExpenseDayGroup[] {
  const recentItems = sortByNewest(items).slice(0, 3);
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

export function buildExpensesSnapshot(items = listMockExpenses()): ExpensesSnapshot {
  return {
    items: sortByNewest(items),
    groups: buildRecentGroups(items),
    categoryTotals: buildCategoryTotals(items),
  };
}

export async function getExpenses(options?: ApiRequestOptions) {
  return withMockLatency(() => buildExpensesSnapshot(), options);
}

export async function logExpense(
  input: LogExpenseInput,
  options?: ApiRequestOptions,
) {
  return withMockLatency(() => appendMockExpense(input), options);
}

export async function deleteExpense(id: string, options?: ApiRequestOptions) {
  return withMockLatency(() => removeMockExpense(id), options);
}

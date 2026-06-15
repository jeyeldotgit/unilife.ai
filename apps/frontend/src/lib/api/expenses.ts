import type { Expense as ExpenseRecord } from "@unilife-ai/types";

import { requestBackend } from "@/lib/api/client";
import {
  findActiveBudget,
  listBudgetRecords,
  listExpenseRecords,
} from "@/lib/api/finance-data";
import {
  formatAmount,
  formatExpenseDayLabel,
  formatTimeLabel,
  getExpenseCategoryIcon,
  getExpenseCategoryLabel,
  inferExpenseCategory,
  titleCase,
} from "@/lib/api/utils";
import type {
  ExpenseCategory,
  ExpenseCategoryTotal,
  ExpenseDayGroup,
  ExpenseItem,
  ExpensesSnapshot,
  LogExpenseInput,
} from "@/lib/types";

type ExpenseResponse = {
  expense: ExpenseRecord | null;
};

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

export async function getExpenses() {
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

  return buildExpensesSnapshot(expenses);
}

export async function logExpense(
  input: LogExpenseInput,
) {
  const budgets = await listBudgetRecords();
  const activeBudget = findActiveBudget(budgets);
  const category = input.category ?? inferExpenseCategory(input.label);
  const timestamp = new Date().toISOString();
  const response = await requestBackend<ExpenseResponse>("/api/expenses", {
    method: "POST",
    body: {
      id: crypto.randomUUID(),
      budget_id: activeBudget?.id ?? null,
      refund_of_expense_id: input.refundOfExpenseId ?? null,
      amount: input.amount,
      category,
      description: input.label.trim(),
      spent_at: input.spentAt ?? timestamp,
      recurrence: input.recurrence ?? null,
      created_at: timestamp,
      updated_at: timestamp,
    },
  });

  if (!response.expense) {
    throw new Error("The backend did not return the created expense.");
  }

  return normalizeExpenseRecord(response.expense);
}

export async function deleteExpense(id: string) {
  const response = await requestBackend<{ ok: boolean }>(`/api/expenses/${id}`, {
    method: "DELETE",
  });

  return response.ok;
}

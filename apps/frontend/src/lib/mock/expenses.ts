import type {
  ExpenseCategory,
  ExpenseItem,
  LogExpenseInput,
} from "@/lib/types";

const categoryLabels: Record<ExpenseCategory, string> = {
  food: "Food",
  transportation: "Transport",
  school: "School",
  entertainment: "Entertainment",
  miscellaneous: "Misc",
};

const categoryIcons: Record<ExpenseCategory, string> = {
  food: "lunch_dining",
  transportation: "commute",
  school: "school",
  entertainment: "stadia_controller",
  miscellaneous: "inventory_2",
};

function formatAmount(amount: number) {
  return `₱ ${amount.toLocaleString("en-PH", {
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDayLabel(date: Date) {
  const today = new Date();
  const yesterday = new Date(today);

  yesterday.setDate(today.getDate() - 1);

  const short = (value: Date) => value.toISOString().slice(0, 10);

  if (short(date) === short(today)) {
    return "Today";
  }

  if (short(date) === short(yesterday)) {
    return "Yesterday";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatTimeLabel(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function inferCategory(label: string): ExpenseCategory {
  const normalized = label.toLowerCase();

  if (
    normalized.includes("lunch") ||
    normalized.includes("food") ||
    normalized.includes("meal") ||
    normalized.includes("snack")
  ) {
    return "food";
  }

  if (
    normalized.includes("fare") ||
    normalized.includes("bus") ||
    normalized.includes("jeep") ||
    normalized.includes("commute")
  ) {
    return "transportation";
  }

  if (
    normalized.includes("book") ||
    normalized.includes("school") ||
    normalized.includes("copy") ||
    normalized.includes("project")
  ) {
    return "school";
  }

  if (
    normalized.includes("movie") ||
    normalized.includes("game") ||
    normalized.includes("cinema")
  ) {
    return "entertainment";
  }

  return "miscellaneous";
}

function createExpenseFixture(
  item: Omit<ExpenseItem, "amountLabel" | "categoryLabel">,
) {
  return {
    ...item,
    amountLabel: formatAmount(item.amount),
    categoryLabel: categoryLabels[item.category],
  } satisfies ExpenseItem;
}

const expenses: ExpenseItem[] = [
  createExpenseFixture({
    id: "expense-lunch",
    label: "Lunch",
    category: "food",
    spentAt: "2026-06-08T12:30:00+08:00",
    dayLabel: "Today",
    timeLabel: "12:30 PM",
    amount: 85,
    icon: "lunch_dining",
    description: null,
    budgetId: "budget-weekly-1",
  }),
  createExpenseFixture({
    id: "expense-fare",
    label: "Fare",
    category: "transportation",
    spentAt: "2026-06-08T08:15:00+08:00",
    dayLabel: "Today",
    timeLabel: "08:15 AM",
    amount: 50,
    icon: "commute",
    description: null,
    budgetId: "budget-weekly-1",
  }),
  createExpenseFixture({
    id: "expense-photocopy",
    label: "Photocopy",
    category: "school",
    spentAt: "2026-06-07T15:45:00+08:00",
    dayLabel: "Yesterday",
    timeLabel: "03:45 PM",
    amount: 30,
    icon: "content_copy",
    description: null,
    budgetId: "budget-weekly-1",
  }),
  createExpenseFixture({
    id: "expense-food-week",
    label: "Canteen Meals",
    category: "food",
    spentAt: "2026-06-06T17:10:00+08:00",
    dayLabel: "Jun 6",
    timeLabel: "05:10 PM",
    amount: 388.55,
    icon: "restaurant",
    description: null,
    budgetId: "budget-weekly-1",
  }),
  createExpenseFixture({
    id: "expense-school-week",
    label: "Project Materials",
    category: "school",
    spentAt: "2026-06-06T10:20:00+08:00",
    dayLabel: "Jun 6",
    timeLabel: "10:20 AM",
    amount: 270.3,
    icon: "school",
    description: null,
    budgetId: "budget-weekly-1",
  }),
  createExpenseFixture({
    id: "expense-transport-week",
    label: "Jeep Fare Top-up",
    category: "transportation",
    spentAt: "2026-06-05T18:40:00+08:00",
    dayLabel: "Jun 5",
    timeLabel: "06:40 PM",
    amount: 146.35,
    icon: "directions_bus",
    description: null,
    budgetId: "budget-weekly-1",
  }),
  createExpenseFixture({
    id: "expense-misc-week",
    label: "Misc Supplies",
    category: "miscellaneous",
    spentAt: "2026-06-04T13:05:00+08:00",
    dayLabel: "Jun 4",
    timeLabel: "01:05 PM",
    amount: 184.8,
    icon: "inventory_2",
    description: null,
    budgetId: "budget-weekly-1",
  }),
];

export function listMockExpenses() {
  return expenses;
}

export function appendMockExpense(input: LogExpenseInput) {
  const spentAt = input.spentAt ?? new Date().toISOString();
  const date = new Date(spentAt);
  const category = input.category ?? inferCategory(input.label);
  const created = createExpenseFixture({
    id: crypto.randomUUID(),
    label: input.label,
    category,
    spentAt,
    dayLabel: formatDayLabel(date),
    timeLabel: formatTimeLabel(date),
    amount: input.amount,
    icon: input.icon ?? categoryIcons[category],
    description: input.description ?? null,
    budgetId: "budget-weekly-1",
  });

  expenses.unshift(created);

  return created;
}

export function removeMockExpense(id: string) {
  const index = expenses.findIndex((expense) => expense.id === id);

  if (index === -1) {
    return null;
  }

  const [removed] = expenses.splice(index, 1);

  return removed;
}

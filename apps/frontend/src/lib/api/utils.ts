import type {
  BudgetPeriod,
  ExpenseCategory,
  ScheduleColor,
} from "@/lib/types";
import { getDateKeyInTimeZone } from "@/lib/profile/time";

export const DAY_ORDER = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

const DAY_LABELS: Record<(typeof DAY_ORDER)[number], string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

const SHORT_DAY_LABELS: Record<(typeof DAY_ORDER)[number], string> = {
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
  sunday: "Sun",
};

const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  food: "Food",
  school: "School",
  transportation: "Transport",
  entertainment: "Entertainment",
  miscellaneous: "Misc",
};

const EXPENSE_CATEGORY_ICONS: Record<ExpenseCategory, string> = {
  food: "lunch_dining",
  transportation: "commute",
  school: "school",
  entertainment: "stadia_controller",
  miscellaneous: "inventory_2",
};

export function getLocalDateKey(date = new Date(), timeZone?: string) {
  if (timeZone) {
    return getDateKeyInTimeZone(timeZone, date);
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function getDayLabel(dayOfWeek: (typeof DAY_ORDER)[number]) {
  return DAY_LABELS[dayOfWeek];
}

export function getShortDayLabel(dayOfWeek: (typeof DAY_ORDER)[number]) {
  return SHORT_DAY_LABELS[dayOfWeek];
}

export function getDayIndex(dayOfWeek: (typeof DAY_ORDER)[number]) {
  return DAY_ORDER.indexOf(dayOfWeek);
}

export function formatAmount(amount: number) {
  return `PHP ${amount.toLocaleString("en-PH", {
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatMonthDay(isoDate: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(isoDate));
}

export function formatTimeLabel(isoDate: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(isoDate));
}

export function formatMonthDayTime(isoDate: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
    .format(new Date(isoDate))
    .replace(",", " •");
}

export function formatDueDateTimeLabel(isoDate: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
    .format(new Date(isoDate))
    .replace(",", " •");
}

export function formatExpenseDayLabel(isoDate: string) {
  const targetDate = new Date(isoDate);
  const todayKey = getLocalDateKey();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = getLocalDateKey(yesterday);
  const targetKey = getLocalDateKey(targetDate);

  if (targetKey === todayKey) {
    return "Today";
  }

  if (targetKey === yesterdayKey) {
    return "Yesterday";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(targetDate);
}

export function titleCase(value: string) {
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function inferExpenseCategory(label: string): ExpenseCategory {
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
    normalized.includes("commute") ||
    normalized.includes("transport") ||
    normalized.includes("transpo") ||
    normalized.includes("grab") ||
    normalized.includes("taxi") ||
    normalized.includes("trike")
  ) {
    return "transportation";
  }

  if (
    normalized.includes("book") ||
    normalized.includes("school") ||
    normalized.includes("copy") ||
    normalized.includes("project") ||
    normalized.includes("supply")
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

export function getExpenseCategoryLabel(category: ExpenseCategory) {
  return EXPENSE_CATEGORY_LABELS[category];
}

export function getExpenseCategoryIcon(category: ExpenseCategory) {
  return EXPENSE_CATEGORY_ICONS[category];
}

export function getScheduleColor(color: string | null | undefined): ScheduleColor {
  if (color === "amber" || color === "green" || color === "blue") {
    return color;
  }

  return "blue";
}

export function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function startOfWeekMonday(date = new Date()) {
  const next = new Date(date);
  const day = next.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  next.setDate(next.getDate() + diff);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function formatDateKey(date: Date) {
  return getLocalDateKey(date);
}

export function toDateTimeLocalValue(isoDate: string) {
  const date = new Date(isoDate);

  const year = String(date.getFullYear());
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function getBudgetCycleLabel(period: BudgetPeriod) {
  if (period === "weekly") {
    return "Weekly Budget";
  }

  if (period === "biweekly") {
    return "Bi-Weekly Budget";
  }

  return "Monthly Budget";
}

export function calculateBudgetEndDate(
  startDate: string,
  period: BudgetPeriod,
) {
  const start = new Date(`${startDate}T00:00:00`);
  const end =
    period === "weekly"
      ? addDays(start, 6)
      : period === "biweekly"
        ? addDays(start, 13)
        : addDays(start, 29);

  return formatDateKey(end);
}

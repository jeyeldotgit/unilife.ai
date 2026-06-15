import type { DayOfWeek, RecurrenceRule } from "@unilife-ai/types";

const DAY_NAMES: DayOfWeek[] = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

export const EXPENSE_RECURRENCE_HORIZON_DAYS = 21;

export function materializeExpenseOccurrenceDates(
  rule: RecurrenceRule,
  horizonDays = EXPENSE_RECURRENCE_HORIZON_DAYS,
) {
  const start = new Date(rule.starts_at);
  const horizon = new Date(start);
  horizon.setDate(horizon.getDate() + horizonDays);
  const end = rule.ends_at ? new Date(rule.ends_at) : horizon;
  const dates: string[] = [];

  for (let cursor = new Date(start); cursor <= end && cursor <= horizon; cursor.setDate(cursor.getDate() + 1)) {
    const elapsedDays = Math.floor((cursor.getTime() - start.getTime()) / 86_400_000);
    const weekday = DAY_NAMES[cursor.getDay()];
    const matches =
      rule.frequency === "daily"
        ? elapsedDays % rule.interval === 0
        : Math.floor(elapsedDays / 7) % rule.interval === 0;
    const weekdayAllowed = rule.weekdays.length === 0 || rule.weekdays.includes(weekday);
    if (matches && weekdayAllowed) dates.push(cursor.toISOString());
  }
  return dates;
}

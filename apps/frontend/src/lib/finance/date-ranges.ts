import { getDateKeyInTimeZone } from "@/lib/profile/time";

export type ExpenseDateFilter = "today" | "yesterday" | "week" | "month" | "custom" | "all";

export type ResolvedExpenseRange = {
  fromAt: string | null;
  toAt: string | null;
  fromDate: string | null;
  toDate: string | null;
};

function addDays(dateKey: string, days: number) {
  const date = new Date(`${dateKey}T12:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function localDateTimeToInstant(dateKey: string, timeZone: string, end = false) {
  const target = `${dateKey}T${end ? "23:59:59.999" : "00:00:00.000"}Z`;
  let candidate = new Date(target);
  for (let index = 0; index < 3; index += 1) {
    const actualKey = getDateKeyInTimeZone(timeZone, candidate);
    const deltaDays =
      (Date.parse(`${dateKey}T00:00:00.000Z`) - Date.parse(`${actualKey}T00:00:00.000Z`)) /
      86_400_000;
    candidate = new Date(candidate.getTime() + deltaDays * 86_400_000);
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    }).formatToParts(candidate);
    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    const currentMs =
      Number(values.hour) * 3_600_000 + Number(values.minute) * 60_000 + Number(values.second) * 1000;
    const wantedMs = end ? 86_399_999 : 0;
    candidate = new Date(candidate.getTime() + wantedMs - currentMs);
  }
  return candidate.toISOString();
}

export function resolveExpenseDateRange(
  filter: ExpenseDateFilter,
  timeZone: string,
  now = new Date(),
  custom?: { from: string; to: string },
): ResolvedExpenseRange {
  if (filter === "all") return { fromAt: null, toAt: null, fromDate: null, toDate: null };
  const today = getDateKeyInTimeZone(timeZone, now);
  let from = today;
  let to = today;
  if (filter === "yesterday") from = to = addDays(today, -1);
  if (filter === "week") {
    const day = new Date(`${today}T12:00:00.000Z`).getUTCDay();
    from = addDays(today, -(day === 0 ? 6 : day - 1));
  }
  if (filter === "month") from = `${today.slice(0, 8)}01`;
  if (filter === "custom") {
    if (!custom?.from || !custom.to || custom.from > custom.to) throw new Error("Choose a valid date range.");
    from = custom.from;
    to = custom.to;
  }
  return {
    fromAt: localDateTimeToInstant(from, timeZone),
    toAt: localDateTimeToInstant(to, timeZone, true),
    fromDate: from,
    toDate: to,
  };
}

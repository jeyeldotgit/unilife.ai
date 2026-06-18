import * as chrono from "chrono-node";
import type { ExpenseCategory } from "./types.js";

const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

export function extractDate(
  input: string,
  referenceDate: Date,
  defaultHour?: number,
) {
  const result = chrono.parse(input, referenceDate, { forwardDate: true })[0];

  if (!result) {
    return null;
  }

  const hasExplicitTime = result.start.isCertain("hour");
  const date = result.start.date();

  if (!hasExplicitTime && defaultHour !== undefined) {
    date.setHours(defaultHour, defaultHour === 23 ? 59 : 0, 0, 0);
  }

  return {
    date,
    hasExplicitTime,
    matchedText: result.text,
  };
}

export function extractDayOfWeek(input: string) {
  return DAYS.find((day) => new RegExp(`\\b${day}\\b`, "i").test(input)) ?? null;
}

function normalizeTime(hourValue: string, minuteValue: string | undefined, meridiem: string) {
  let hour = Number(hourValue);
  const minute = Number(minuteValue ?? "0");

  if (meridiem.toLowerCase() === "pm" && hour < 12) {
    hour += 12;
  }
  if (meridiem.toLowerCase() === "am" && hour === 12) {
    hour = 0;
  }

  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function extractTimeRange(input: string) {
  const match =
    /\b(?:from\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)\s*(?:to|-|until)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i.exec(
      input,
    );

  if (!match) {
    return null;
  }

  return {
    startTime: normalizeTime(match[1], match[2], match[3]),
    endTime: normalizeTime(match[4], match[5], match[6]),
    matchedText: match[0],
  };
}

export function extractAmount(input: string) {
  const match = /(?:php|₱|p)?\s*(\d+(?:\.\d{1,2})?)/i.exec(input);
  const amount = match ? Number(match[1]) : null;

  return amount && amount > 0
    ? { amount, matchedText: match?.[0].trim() ?? "" }
    : null;
}

function editDistance(left: string, right: string) {
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  const current = Array.from({ length: right.length + 1 }, () => 0);

  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    current[0] = leftIndex;

    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const substitutionCost = left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1;
      current[rightIndex] = Math.min(
        previous[rightIndex] + 1,
        current[rightIndex - 1] + 1,
        previous[rightIndex - 1] + substitutionCost,
      );
    }

    for (let index = 0; index < previous.length; index += 1) {
      previous[index] = current[index];
    }
  }

  return previous[right.length];
}

function hasApproximateToken(input: string, terms: string[]) {
  const tokens = input.toLowerCase().match(/[a-z]{3,}/g) ?? [];

  return tokens.some((token) =>
    terms.some((term) => {
      if (token === term || token.includes(term) || term.includes(token)) {
        return true;
      }

      const tolerance = term.length <= 5 ? 1 : 2;
      return editDistance(token, term) <= tolerance;
    }),
  );
}

export function extractExpenseCategory(input: string): ExpenseCategory {
  if (
    /\b(lunch|food|meal|snack|ulam|meryenda|breakfast|dinner|drink|coffee|milk tea)\b/i.test(
      input,
    ) ||
    hasApproximateToken(input, ["lunch", "food", "meal", "snack"])
  ) {
    return "food";
  }
  if (
    /\b(fare|bus|jeep|commute|transport|transportation|transpo|grab|taxi|trike|train|lrt|mrt)\b/i.test(
      input,
    )
  ) {
    return "transportation";
  }
  if (/\b(book|school|copy|project|supplies|tuition)\b/i.test(input)) {
    return "school";
  }
  if (/\b(movie|game|cinema|concert|bar|club|gig)\b/i.test(input)) {
    return "entertainment";
  }

  return "miscellaneous";
}

export function cleanTopic(input: string, removable: Array<string | RegExp>) {
  return removable
    .reduce<string>(
      (value, item) =>
        value.replace(
          typeof item === "string"
            ? new RegExp(`\\b${item.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi")
            : item,
          " ",
        ),
      input,
    )
    .replace(
      /\b(add|create|log|record|my|on|at|for|due|please|ako|ng|sa|as|in|budget|category)\b/gi,
      " ",
    )
    .replace(/\s*[-:]\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

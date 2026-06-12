import type { ParsedAction } from "../schemas/parsed-action.js";
import type { NormalizedInput } from "../preprocess.js";
import {
  cleanTopic,
  extractAmount,
  extractDate,
  extractDayOfWeek,
  extractExpenseCategory,
  extractTimeRange,
} from "../extractors/index.js";

type IntentResult = ParsedAction | null;

function titleCase(value: string) {
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function extractTopic(input: NormalizedInput, cleanedTopic: string) {
  if (cleanedTopic) {
    return cleanedTopic;
  }

  const nouns = input.document.nouns().out("array") as string[];
  return nouns.join(" ").trim();
}

function unknown(
  candidateIntent: Exclude<ParsedAction["intent"], "unknown">,
  reason: string,
  confidence = 0.5,
): ParsedAction {
  return {
    intent: "unknown",
    confidence,
    data: {
      candidate_intent: candidateIntent,
      reason,
    },
  };
}

export function tryQueryDeadlines(input: NormalizedInput): IntentResult {
  const isDeadlineQuestion =
    /\b(what(?:'s| is)|show|list|anything|ano|may)\b.*\b(due|deadline|deadlines)\b/i.test(
      input.normalized,
    ) ||
    /\b(due|deadline|deadlines)\b.*\b(today|this week|next week)\??$/i.test(
      input.normalized,
    );

  if (!isDeadlineQuestion) {
    return null;
  }

  return {
    intent: "query_deadlines",
    confidence: 0.95,
    data: {
      range: /\btoday\b/i.test(input.normalized) ? "today" : "next_seven_days",
    },
  };
}

export function tryCreateAssignment(
  input: NormalizedInput,
  referenceDate: Date,
): IntentResult {
  if (!input.document.has("(assignment|task|homework|deadline|submit|pass)")) {
    return null;
  }

  const date = extractDate(input.normalized, referenceDate, 23);
  if (!date) {
    return unknown("create_assignment", "Include when the assignment is due.");
  }

  const title = extractTopic(
    input,
    cleanTopic(input.normalized, [
      "assignment",
      "task",
      "homework",
      "deadline",
      "submit",
      "pass",
      date.matchedText,
    ]),
  );

  if (!title) {
    return unknown("create_assignment", "Include an assignment title.");
  }

  return {
    intent: "create_assignment",
    confidence: 0.9,
    data: {
      title: titleCase(title),
      due_date: date.date.toISOString(),
    },
  };
}

export function tryCreateClass(input: NormalizedInput): IntentResult {
  if (!input.document.has("class")) {
    return null;
  }

  const day = extractDayOfWeek(input.normalized);
  const times = extractTimeRange(input.normalized);

  if (!day || !times) {
    return unknown(
      "create_class",
      "Include the subject, weekday, start time, and end time.",
    );
  }

  const subject = extractTopic(
    input,
    cleanTopic(input.normalized, ["class", day, times.matchedText]),
  );

  if (!subject) {
    return unknown("create_class", "Include the class subject.");
  }

  return {
    intent: "create_class",
    confidence: 0.92,
    data: {
      subject: titleCase(subject),
      day_of_week: day,
      start_time: times.startTime,
      end_time: times.endTime,
    },
  };
}

export function tryCreateExam(input: NormalizedInput, referenceDate: Date): IntentResult {
  if (!input.document.has("(exam|quiz|test)")) {
    return null;
  }

  const date = extractDate(input.normalized, referenceDate);
  if (!date || !date.hasExplicitTime) {
    return unknown("create_exam", "Include the exact exam date and time.");
  }

  const locationMatch = /\b(?:in|at)\s+(room\s+[\w-]+)\b/i.exec(input.normalized);
  const title = extractTopic(
    input,
    cleanTopic(input.normalized, [
      "exam",
      "quiz",
      "test",
      date.matchedText,
      locationMatch?.[0] ?? "",
    ]),
  );

  if (!title) {
    return unknown("create_exam", "Include an exam title.");
  }

  return {
    intent: "create_exam",
    confidence: 0.9,
    data: {
      title: titleCase(title),
      exam_date: date.date.toISOString(),
      ...(locationMatch ? { location: titleCase(locationMatch[1]) } : {}),
    },
  };
}

export function tryLogExpense(input: NormalizedInput): IntentResult {
  const hasExpenseCue =
    input.document.has("(expense|spent|lunch|fare|food|transpo)") ||
    /\b(paid|bayad)\b/i.test(input.normalized);

  if (!hasExpenseCue) {
    return null;
  }

  const amount = extractAmount(input.normalized);
  if (!amount) {
    return unknown("log_expense", "Include a positive expense amount.");
  }

  const label = extractTopic(
    input,
    cleanTopic(input.normalized, [
      "expense",
      "spent",
      "paid",
      "bayad",
      amount.matchedText,
    ]),
  );

  if (!label) {
    return unknown("log_expense", "Include what the expense was for.");
  }

  return {
    intent: "log_expense",
    confidence: 0.95,
    data: {
      amount: amount.amount,
      label: titleCase(label),
      category: extractExpenseCategory(input.normalized),
    },
  };
}

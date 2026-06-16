import { randomUUID } from "node:crypto";
import type { ScheduleImportEntry } from "@unilife-ai/types";

export const SCHEDULE_OCR_PARSER_VERSION = "tesseract-local-v1";

const DAY_BY_CODE: Record<string, string> = {
  M: "monday",
  T: "tuesday",
  W: "wednesday",
  TH: "thursday",
  F: "friday",
  S: "saturday",
  SU: "sunday",
  SUN: "sunday",
  SUNDAY: "sunday",
};

type CourseBlock = {
  row: string;
  faculty: string | null;
};

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function getCourseBlocks(text: string) {
  const lines = text
    .split(/\r?\n/)
    .map(normalizeWhitespace)
    .filter(Boolean);
  const blocks: CourseBlock[] = [];
  let current: CourseBlock | null = null;

  for (const line of lines) {
    if (/^\d+\s+/.test(line)) {
      if (current) blocks.push(current);
      current = { row: line, faculty: null };
      continue;
    }

    if (/^Faculty:/i.test(line)) {
      if (current) {
        current.faculty = line.replace(/^Faculty:\s*/i, "").trim() || null;
      }
      continue;
    }

    if (current && !/^SubjectCode\b/i.test(line)) {
      current.row = normalizeWhitespace(`${current.row} ${line}`);
    }
  }

  if (current) blocks.push(current);
  return blocks;
}

function parseCourseCodeAndDescription(value: string) {
  const tokens = value.trim().split(/\s+/);
  const first = tokens[0] ?? "";
  const second = tokens[1] ?? "";
  let courseCode = first;
  let descriptionStart = 1;

  if (/^[A-Z]{2,}$/.test(first) && /^\d+[A-Z0-9]*$/i.test(second)) {
    courseCode = `${first} ${second}`;
    descriptionStart = 2;
  }

  return {
    courseCode,
    description: tokens.slice(descriptionStart).join(" ").trim(),
  };
}

function parseDayCodes(value: string) {
  const normalized = value
    .toUpperCase()
    .replace(/-/g, " ")
    .replace(/\s+/g, "");
  if (!normalized) return [];

  return normalized
    .split("/")
    .map((code) => DAY_BY_CODE[code])
    .filter(Boolean);
}

function to24Hour(value: string) {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;
  let hour = Number(match[1]);
  const minute = match[2];
  const marker = match[3].toUpperCase();
  if (marker === "AM" && hour === 12) hour = 0;
  if (marker === "PM" && hour !== 12) hour += 12;
  return `${String(hour).padStart(2, "0")}:${minute}`;
}

function parseTimeRanges(value: string) {
  return value
    .split("/")
    .map((part) => {
      const match = part.match(
        /(\d{1,2}:\d{2}\s*(?:AM|PM))\s*-\s*(\d{1,2}:\d{2}\s*(?:AM|PM))/i,
      );
      if (!match) return null;
      const start = to24Hour(match[1]);
      const end = to24Hour(match[2]);
      return start && end ? { start, end } : null;
    })
    .filter((range): range is { start: string; end: string } => Boolean(range));
}

function parseCourseBlock(block: CourseBlock) {
  const rowWithoutNumber = block.row.replace(/^\d+\s+/, "");
  const numericMatch = rowWithoutNumber.match(
    /\s+\d+(?:\.\d+)?\s+\d+(?:\.\d+)?\s+\d+(?:\.\d+)?\s+/,
  );
  if (!numericMatch || numericMatch.index === undefined) {
    return [];
  }

  const beforeUnits = rowWithoutNumber.slice(0, numericMatch.index).trim();
  const afterUnits = rowWithoutNumber.slice(numericMatch.index + numericMatch[0].length).trim();
  const { courseCode, description } = parseCourseCodeAndDescription(beforeUnits);
  const firstTimeIndex = afterUnits.search(/\d{1,2}:\d{2}\s*(?:AM|PM)/i);
  const warnings: string[] = [];

  if (firstTimeIndex < 0) {
    warnings.push("No valid time range found.");
  }

  const sectionAndDays = firstTimeIndex >= 0 ? afterUnits.slice(0, firstTimeIndex).trim() : afterUnits;
  const timePart = firstTimeIndex >= 0 ? afterUnits.slice(firstTimeIndex).trim() : "";
  const sectionMatch = sectionAndDays.match(/\b\d-[A-Z]+\s+\d-\d\b/i);
  const section = sectionMatch ? normalizeWhitespace(sectionMatch[0]) : null;
  const dayPart = sectionMatch
    ? sectionAndDays.slice(sectionMatch.index! + sectionMatch[0].length)
    : sectionAndDays;
  const days = parseDayCodes(dayPart);
  const ranges = parseTimeRanges(timePart);

  if (days.length === 0) warnings.push("No valid day code found.");
  if (ranges.length === 0) warnings.push("No valid time range found.");
  if (days.length !== ranges.length && !(days.length === 1 && ranges.length === 1)) {
    warnings.push("Day count and time range count do not match.");
  }

  const count = Math.max(days.length, ranges.length, 1);
  return Array.from({ length: count }, (_, index): ScheduleImportEntry => {
    const day = days[index] ?? (days.length === 1 ? days[0] : null);
    const range = ranges[index] ?? (ranges.length === 1 ? ranges[0] : null);
    const uncertainFields: string[] = [];
    if (!courseCode || !description) uncertainFields.push("subject");
    if (!day) uncertainFields.push("day_of_week");
    if (!range?.start) uncertainFields.push("start_time");
    if (!range?.end) uncertainFields.push("end_time");

    return {
      id: randomUUID(),
      selected: uncertainFields.length === 0 && warnings.length === 0,
      subject: courseCode && description ? `${courseCode} ${description}` : null,
      room: null,
      instructor: block.faculty,
      recurrence: null,
      day_of_week: day,
      start_time: range?.start ?? null,
      end_time: range?.end ?? null,
      confidence: uncertainFields.length === 0 ? 0.86 : 0.52,
      uncertain_fields: uncertainFields,
      duplicate_candidates: [],
      conflict_candidates: [],
      course_code: courseCode || null,
      section,
      source_row: block.row,
      parse_warnings: warnings,
    };
  });
}

export function parseScheduleOcrText(text: string) {
  const entries = getCourseBlocks(text).flatMap(parseCourseBlock);
  if (entries.length === 0) {
    return [
      {
        id: randomUUID(),
        selected: false,
        subject: null,
        room: null,
        instructor: null,
        recurrence: null,
        day_of_week: null,
        start_time: null,
        end_time: null,
        confidence: null,
        uncertain_fields: ["subject", "day_of_week", "start_time", "end_time"],
        duplicate_candidates: [],
        conflict_candidates: [],
        course_code: null,
        section: null,
        source_row: null,
        parse_warnings: ["No numbered course rows were recognized."],
      } satisfies ScheduleImportEntry,
    ];
  }
  return entries;
}

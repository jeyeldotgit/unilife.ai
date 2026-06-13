import type {
  Assignment,
  ClassRecord,
  DayOfWeek,
  RecurrenceRule,
  ScheduleConflict,
} from "@unilife-ai/types";

import {
  DAY_ORDER,
  getDayIndex,
  getLocalDateKey,
  startOfWeekMonday,
} from "@/lib/api/utils";

export const RECURRENCE_MATERIALIZATION_HORIZON_DAYS = 21;

export type MaterializedClassOccurrence = {
  id: string;
  logicalId: string;
  subject: string;
  dayOfWeek: DayOfWeek;
  dayIndex: number;
  startTime: string;
  endTime: string;
  room: string | null;
  instructor: string | null;
  color: string | null;
  sourceClassId: string;
  occurrenceStartAt: string;
  occurrenceEndAt: string;
  spansOvernight: boolean;
  isToday: boolean;
};

type DateRange = {
  start: Date;
  end: Date;
};

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function parseTime(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return { hours, minutes };
}

function setTime(date: Date, time: string) {
  const next = new Date(date);
  const { hours, minutes } = parseTime(time);
  next.setHours(hours, minutes, 0, 0);
  return next;
}

function normalizeWeekdays(rule: RecurrenceRule | null | undefined, fallback: DayOfWeek) {
  if (!rule) {
    return [fallback];
  }

  if (rule.frequency === "daily" && rule.weekdays.length === 0) {
    return [...DAY_ORDER];
  }

  return rule.weekdays.length > 0 ? rule.weekdays : [fallback];
}

function createOccurrence(
  record: ClassRecord,
  start: Date,
  end: Date,
  timeZone?: string,
): MaterializedClassOccurrence {
  const spansOvernight = end.getTime() <= start.getTime();
  const effectiveEnd = spansOvernight ? addDays(end, 1) : end;
  const startKey = getLocalDateKey(start, timeZone);
  const todayKey = getLocalDateKey(new Date(), timeZone);
  const dayOfWeek = DAY_ORDER[(start.getDay() + 6) % 7] as DayOfWeek;

  return {
    color: record.color,
    dayIndex: getDayIndex(dayOfWeek),
    dayOfWeek,
    endTime: record.end_time,
    id: `${record.id}:${start.toISOString()}`,
    instructor: record.instructor,
    isToday: startKey === todayKey,
    logicalId: record.id,
    occurrenceEndAt: effectiveEnd.toISOString(),
    occurrenceStartAt: start.toISOString(),
    room: record.room,
    sourceClassId: record.id,
    spansOvernight,
    startTime: record.start_time,
    subject: record.subject,
  };
}

function materializeStandaloneClass(
  record: ClassRecord,
  range: DateRange,
  timeZone?: string,
) {
  const occurrences: MaterializedClassOccurrence[] = [];

  for (let cursor = new Date(range.start); cursor <= range.end; cursor = addDays(cursor, 1)) {
    const dayOfWeek = DAY_ORDER[(cursor.getDay() + 6) % 7] as DayOfWeek;
    if (dayOfWeek !== record.day_of_week) {
      continue;
    }

    const start = setTime(cursor, record.start_time);
    const end = setTime(cursor, record.end_time);
    occurrences.push(createOccurrence(record, start, end, timeZone));
  }

  return occurrences;
}

function materializeRecurringClass(
  record: ClassRecord,
  range: DateRange,
  rule: RecurrenceRule,
  timeZone?: string,
) {
  const startsAt = new Date(rule.starts_at);
  const endsAt = rule.ends_at ? new Date(rule.ends_at) : null;
  const weekdays = normalizeWeekdays(rule, record.day_of_week);
  const occurrences: MaterializedClassOccurrence[] = [];

  for (let cursor = new Date(range.start); cursor <= range.end; cursor = addDays(cursor, 1)) {
    const dayOfWeek = DAY_ORDER[(cursor.getDay() + 6) % 7] as DayOfWeek;
    if (!weekdays.includes(dayOfWeek)) {
      continue;
    }

    const start = setTime(cursor, record.start_time);
    if (start < startsAt) {
      continue;
    }
    if (endsAt && start > endsAt) {
      continue;
    }

    if (rule.frequency === "weekly") {
      const diffDays = Math.floor((start.getTime() - startsAt.getTime()) / (24 * 60 * 60 * 1000));
      const diffWeeks = Math.floor(diffDays / 7);
      if (diffWeeks % rule.interval !== 0) {
        continue;
      }
    }

    if (rule.frequency === "daily") {
      const diffDays = Math.floor((start.getTime() - startsAt.getTime()) / (24 * 60 * 60 * 1000));
      if (diffDays % rule.interval !== 0) {
        continue;
      }
    }

    const end = setTime(cursor, record.end_time);
    occurrences.push(createOccurrence(record, start, end, timeZone ?? rule.timezone));
  }

  return occurrences;
}

function duplicateOvernightOccurrence(
  occurrence: MaterializedClassOccurrence,
  timeZone?: string,
) {
  if (!occurrence.spansOvernight) {
    return [occurrence];
  }

  const nextDay = new Date(occurrence.occurrenceEndAt);
  const dayOfWeek = DAY_ORDER[(nextDay.getDay() + 6) % 7] as DayOfWeek;
  const todayKey = getLocalDateKey(new Date(), timeZone);

  return [
    occurrence,
    {
      ...occurrence,
      dayIndex: getDayIndex(dayOfWeek),
      dayOfWeek,
      id: `${occurrence.id}:overnight`,
      isToday: getLocalDateKey(nextDay, timeZone) === todayKey,
      startTime: "00:00",
    },
  ];
}

export function materializeClassOccurrences(
  classRecords: ClassRecord[],
  options?: {
    rangeStart?: Date;
    rangeEnd?: Date;
    timeZone?: string;
  },
) {
  const rangeStart = options?.rangeStart ?? startOfWeekMonday();
  const rangeEnd = options?.rangeEnd ?? addDays(rangeStart, 6);
  const occurrences = classRecords
    .filter((record) => record.is_active && record.deleted_at === null)
    .flatMap((record) => {
      const rule = record.recurrence?.rule;
      return rule
        ? materializeRecurringClass(record, { end: rangeEnd, start: rangeStart }, rule, options?.timeZone)
        : materializeStandaloneClass(record, { end: rangeEnd, start: rangeStart }, options?.timeZone);
    })
    .flatMap((occurrence) => duplicateOvernightOccurrence(occurrence, options?.timeZone))
    .sort((left, right) => left.occurrenceStartAt.localeCompare(right.occurrenceStartAt));

  return occurrences;
}

export function getClassOccurrencesForNotifications(
  record: ClassRecord,
  now = new Date(),
  horizonDays = 14,
) {
  const end = addDays(now, horizonDays);
  return materializeClassOccurrences([record], {
    rangeEnd: end,
    rangeStart: now,
    timeZone: record.recurrence?.timezone ?? undefined,
  })
    .filter((occurrence) => !occurrence.id.endsWith(":overnight"))
    .map((occurrence) => new Date(occurrence.occurrenceStartAt));
}

export function materializeAssignmentDueDates(
  record: Assignment,
  now = new Date(),
  horizonDays = RECURRENCE_MATERIALIZATION_HORIZON_DAYS,
) {
  if (!record.recurrence?.rule) {
    return [record.due_date];
  }

  const startsAt = new Date(record.recurrence.rule.starts_at);
  const endsAt = record.recurrence.rule.ends_at
    ? new Date(record.recurrence.rule.ends_at)
    : null;
  const dueTemplate = new Date(record.due_date);
  const timePart = `${String(dueTemplate.getHours()).padStart(2, "0")}:${String(
    dueTemplate.getMinutes(),
  ).padStart(2, "0")}`;
  const horizonEnd = addDays(now, horizonDays);
  const dueDates: string[] = [];

  for (let cursor = new Date(now); cursor <= horizonEnd; cursor = addDays(cursor, 1)) {
    const candidate = setTime(cursor, timePart);
    if (candidate < startsAt) {
      continue;
    }
    if (endsAt && candidate > endsAt) {
      continue;
    }

    if (record.recurrence.rule.frequency === "daily") {
      const diffDays = Math.floor(
        (candidate.getTime() - startsAt.getTime()) / (24 * 60 * 60 * 1000),
      );
      if (diffDays % record.recurrence.rule.interval === 0) {
        dueDates.push(candidate.toISOString());
      }
      continue;
    }

    const dayOfWeek = DAY_ORDER[(candidate.getDay() + 6) % 7] as DayOfWeek;
    if (!normalizeWeekdays(record.recurrence.rule, dayOfWeek).includes(dayOfWeek)) {
      continue;
    }
    const diffDays = Math.floor(
      (candidate.getTime() - startsAt.getTime()) / (24 * 60 * 60 * 1000),
    );
    const diffWeeks = Math.floor(diffDays / 7);
    if (diffWeeks % record.recurrence.rule.interval === 0) {
      dueDates.push(candidate.toISOString());
    }
  }

  return dueDates;
}

export function detectScheduleConflicts(
  occurrences: Array<{
    id: string;
    logicalId: string;
    subject: string;
    occurrenceStartAt: string;
    occurrenceEndAt: string;
  }>,
): ScheduleConflict[] {
  const conflicts: ScheduleConflict[] = [];

  for (let index = 0; index < occurrences.length; index += 1) {
    const current = occurrences[index];
    const currentStart = new Date(current.occurrenceStartAt).getTime();
    const currentEnd = new Date(current.occurrenceEndAt).getTime();

    for (let otherIndex = index + 1; otherIndex < occurrences.length; otherIndex += 1) {
      const other = occurrences[otherIndex];
      if (current.logicalId === other.logicalId) {
        continue;
      }

      const otherStart = new Date(other.occurrenceStartAt).getTime();
      const otherEnd = new Date(other.occurrenceEndAt).getTime();
      if (currentEnd <= otherStart || otherEnd <= currentStart) {
        continue;
      }

      conflicts.push({
        ends_at: current.occurrenceEndAt,
        entity_id: current.id,
        entity_type: "class",
        id: `${current.id}:${other.id}`,
        related_ends_at: other.occurrenceEndAt,
        related_entity_id: other.id,
        related_entity_type: "class",
        related_starts_at: other.occurrenceStartAt,
        related_title: other.subject,
        starts_at: current.occurrenceStartAt,
        title: current.subject,
      });
    }
  }

  return conflicts;
}

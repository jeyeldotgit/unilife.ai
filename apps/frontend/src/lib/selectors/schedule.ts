import type {
  Assignment as AssignmentRecord,
  ClassRecord,
} from "@unilife-ai/types";

import {
  DAY_ORDER,
  formatMonthDay,
  getDayIndex,
  getDayLabel,
  getScheduleColor,
  getShortDayLabel,
  startOfWeekMonday,
} from "@/lib/api/utils";
import { normalizeAssignmentRecord } from "@/lib/selectors/assignments";
import type {
  ClassOption,
  LinkedAssignmentSummary,
  ScheduleAgendaItem,
  ScheduleClass,
  ScheduleClassDetail,
  ScheduleDay,
  ScheduleWeek,
} from "@/lib/types";

function parseHour(time: string) {
  return Number.parseInt(time.slice(0, 2), 10);
}

function parseMinutes(time: string) {
  const [hours, minutes] = time.split(":");
  return Number.parseInt(hours, 10) * 60 + Number.parseInt(minutes, 10);
}

function formatClassTimeLabel(startTime: string, endTime: string) {
  return `${startTime} - ${endTime}`;
}

function formatLocationLabel(room: string | null) {
  return room ?? "No room assigned";
}

function toLinkedAssignmentSummary(
  assignment: ReturnType<typeof normalizeAssignmentRecord>,
): LinkedAssignmentSummary {
  const dueLabel =
    assignment.status === "completed"
      ? "Completed"
      : assignment.urgency.label.toLowerCase().replace(/^./, (value) =>
          value.toUpperCase(),
        );

  return {
    id: assignment.id,
    title: assignment.title,
    dueLabel,
    status: assignment.status,
    urgencyLabel: assignment.urgency.label,
  };
}

function buildDisplayedDayOrder(classRecords: ClassRecord[]) {
  const hasWeekendClasses = classRecords.some(
    (record) =>
      record.day_of_week === "saturday" || record.day_of_week === "sunday",
  );

  return hasWeekendClasses ? DAY_ORDER : DAY_ORDER.slice(0, 5);
}

function buildScheduleDays(dayOrder: readonly ClassRecord["day_of_week"][]) {
  const weekStart = startOfWeekMonday();

  return dayOrder.map((dayOfWeek, index) => {
    const dayDate = new Date(weekStart);
    dayDate.setDate(weekStart.getDate() + index);

    return {
      dayIndex: getDayIndex(dayOfWeek),
      dayOfWeek,
      shortLabel: getShortDayLabel(dayOfWeek),
      dateLabel: formatMonthDay(dayDate.toISOString()).split(" ")[1] ?? "",
    } satisfies ScheduleDay;
  });
}

function buildWeekLabel(days: ScheduleDay[]) {
  if (days.length === 0) {
    return "This Week";
  }

  const weekStart = startOfWeekMonday();
  const firstDate = new Date(weekStart);
  const lastDate = new Date(weekStart);
  lastDate.setDate(weekStart.getDate() + days.length - 1);

  return `${formatMonthDay(firstDate.toISOString())} - ${formatMonthDay(lastDate.toISOString())}`;
}

function buildHours(classRecords: ClassRecord[]) {
  const minHour = Math.min(
    8,
    ...classRecords.map((record) => parseHour(record.start_time)),
  );
  const maxHour = Math.max(
    15,
    ...classRecords.map((record) => parseHour(record.start_time)),
  );

  return Array.from({ length: maxHour - minHour + 1 }, (_, index) => minHour + index);
}

function buildMeetingLabels(classRecords: ClassRecord[]) {
  const labels = new Map<string, string>();
  const grouped = new Map<string, ClassRecord[]>();

  for (const record of classRecords) {
    const key = [
      record.subject,
      record.start_time,
      record.end_time,
      record.room ?? "",
      record.instructor ?? "",
    ].join("|");
    const existing = grouped.get(key) ?? [];
    existing.push(record);
    grouped.set(key, existing);
  }

  for (const records of grouped.values()) {
    const label = records
      .slice()
      .sort((left, right) => {
        return getDayIndex(left.day_of_week) - getDayIndex(right.day_of_week);
      })
      .map((record) => getDayLabel(record.day_of_week))
      .join(" & ");

    for (const record of records) {
      labels.set(record.id, label);
    }
  }

  return labels;
}

function buildTodayClasses(
  classes: ScheduleClass[],
  todayDayOfWeek: ClassRecord["day_of_week"],
) {
  return classes
    .filter((classItem) => classItem.dayOfWeek === todayDayOfWeek)
    .sort((left, right) => left.startTime.localeCompare(right.startTime))
    .map((classItem) => {
      return {
        id: classItem.id,
        subject: classItem.subject,
        startTime: classItem.startTime,
        endTime: classItem.endTime,
        timeLabel: classItem.startTime,
        locationLabel: classItem.locationLabel,
      } satisfies ScheduleAgendaItem;
    });
}

function buildFreeWindows(
  classes: ScheduleClass[],
  hours: number[],
  displayedDays: ScheduleDay[],
) {
  if (hours.length === 0) {
    return [];
  }

  const gridStartMinutes = hours[0] * 60;
  const gridEndMinutes = (hours[hours.length - 1] + 1) * 60;
  const windows: ScheduleWeek["freeWindows"] = [];

  for (const day of displayedDays) {
    const classesForDay = classes
      .filter((classItem) => classItem.dayOfWeek === day.dayOfWeek)
      .sort((left, right) => left.startTime.localeCompare(right.startTime));
    let cursor = gridStartMinutes;

    for (const classItem of classesForDay) {
      const startMinutes = parseMinutes(classItem.startTime);
      if (startMinutes > cursor) {
        const startHour = Math.floor(cursor / 60);
        const endHour = Math.floor(startMinutes / 60);

        if (endHour > startHour) {
          windows.push({
            id: `${day.dayOfWeek}-${startHour}-${endHour}`,
            dayOfWeek: day.dayOfWeek,
            dayIndex: day.dayIndex,
            startHour,
            endHour,
            startTime: `${String(startHour).padStart(2, "0")}:00`,
            endTime: `${String(endHour).padStart(2, "0")}:00`,
            durationMinutes: startMinutes - cursor,
            label: `${getDayLabel(day.dayOfWeek)} ${String(startHour).padStart(2, "0")}:00 - ${String(endHour).padStart(2, "0")}:00`,
          });
        }
      }

      cursor = Math.max(cursor, parseMinutes(classItem.endTime));
    }

    if (cursor < gridEndMinutes) {
      const startHour = Math.floor(cursor / 60);
      const endHour = Math.floor(gridEndMinutes / 60);

      if (endHour > startHour) {
        windows.push({
          id: `${day.dayOfWeek}-${startHour}-${endHour}`,
          dayOfWeek: day.dayOfWeek,
          dayIndex: day.dayIndex,
          startHour,
          endHour,
          startTime: `${String(startHour).padStart(2, "0")}:00`,
          endTime: `${String(endHour).padStart(2, "0")}:00`,
          durationMinutes: gridEndMinutes - cursor,
          label: `${getDayLabel(day.dayOfWeek)} ${String(startHour).padStart(2, "0")}:00 - ${String(endHour).padStart(2, "0")}:00`,
        });
      }
    }
  }

  return windows;
}

export function buildScheduleWeekSnapshot(
  classRecords: ClassRecord[],
  assignmentRecords: AssignmentRecord[],
) {
  const displayedDayOrder = buildDisplayedDayOrder(classRecords);
  const days = buildScheduleDays(displayedDayOrder);
  const hours = buildHours(classRecords);
  const classSubjectById = new Map(
    classRecords.map((record) => [record.id, record.subject] as const),
  );
  const normalizedAssignments = assignmentRecords.map((record) =>
    normalizeAssignmentRecord(record, {
      classSubjectById,
    }),
  );
  const linkedAssignmentIdsByClass = new Map<string, string[]>();
  for (const assignment of normalizedAssignments) {
    if (!assignment.classId) {
      continue;
    }

    const existing = linkedAssignmentIdsByClass.get(assignment.classId) ?? [];
    existing.push(assignment.id);
    linkedAssignmentIdsByClass.set(assignment.classId, existing);
  }

  const classes = classRecords
    .slice()
    .sort((left, right) => {
      const dayDiff = getDayIndex(left.day_of_week) - getDayIndex(right.day_of_week);
      if (dayDiff !== 0) {
        return dayDiff;
      }

      return left.start_time.localeCompare(right.start_time);
    })
    .map((record) => {
      return {
        id: record.id,
        subject: record.subject,
        dayOfWeek: record.day_of_week,
        dayIndex: getDayIndex(record.day_of_week),
        startTime: record.start_time,
        endTime: record.end_time,
        timeLabel: formatClassTimeLabel(record.start_time, record.end_time),
        gridHour: parseHour(record.start_time),
        label: record.subject,
        color: getScheduleColor(record.color),
        room: record.room,
        locationLabel: formatLocationLabel(record.room),
        instructor: record.instructor,
        linkedAssignmentIds: linkedAssignmentIdsByClass.get(record.id) ?? [],
      } satisfies ScheduleClass;
    });
  const meetingLabels = buildMeetingLabels(classRecords);
  const classDetails = Object.fromEntries(
    classes.map((classItem) => {
      const linkedAssignments = normalizedAssignments
        .filter((assignment) => assignment.classId === classItem.id)
        .map(toLinkedAssignmentSummary);

      return [
        classItem.id,
        {
          ...classItem,
          meetingLabel:
            meetingLabels.get(classItem.id) ?? getDayLabel(classItem.dayOfWeek),
          assignments: linkedAssignments,
        } satisfies ScheduleClassDetail,
      ];
    }),
  ) satisfies Record<string, ScheduleClassDetail>;

  const today = new Date();
  const todayDayOfWeek = DAY_ORDER[(today.getDay() + 6) % 7];

  return {
    weekLabel: buildWeekLabel(days),
    days,
    hours,
    classes,
    freeWindows: buildFreeWindows(classes, hours, days),
    todayClasses: buildTodayClasses(classes, todayDayOfWeek),
    classDetails,
  } satisfies ScheduleWeek;
}

export function buildClassOptions(classRecords: ClassRecord[]): ClassOption[] {
  return classRecords
    .slice()
    .sort((left, right) => left.subject.localeCompare(right.subject))
    .map((record) => ({
      id: record.id,
      label: record.subject,
    }));
}

import type {
  Assignment,
  Budget,
  ClassRecord,
  Exam,
  Expense,
  Notification,
  NotificationCategory,
  NotificationEntityType,
} from "@unilife-ai/types";

import {
  getClassOccurrencesForNotifications,
  materializeAssignmentDueDates,
} from "@/lib/schedule/recurrence";

const MINUTE_MS = 60 * 1000;
type AcademicNotificationCategory = "class" | "assignment" | "exam";

export const NOTIFICATION_OFFSETS = {
  class: [30],
  assignment: [7 * 1440, 3 * 1440, 1440, 180],
  exam: [14 * 1440, 7 * 1440, 3 * 1440, 1440],
} as const;

function notificationId(
  category: NotificationCategory,
  logicalItemId: string,
  scheduledAt: string,
) {
  return `${category}:${logicalItemId}:${scheduledAt}`;
}

function offsetLabel(minutes: number) {
  if (minutes % 1440 === 0) {
    const days = minutes / 1440;
    return `${days}-day`;
  }

  if (minutes % 60 === 0) {
    const hours = minutes / 60;
    return `${hours}-hour`;
  }

  return `${minutes}-minute`;
}

function createNotification(input: {
  body: string;
  createdAt: string;
  entityId: string;
  entityType: NotificationEntityType;
  category?: NotificationCategory;
  id?: string;
  logicalItemId?: string;
  scheduledAt: Date;
  title: string;
  userId: string;
}): Notification {
  const scheduledAt = input.scheduledAt.toISOString();

  return {
    body: input.body,
    category: input.category ?? input.entityType,
    created_at: input.createdAt,
    entity_id: input.entityId,
    entity_type: input.entityType,
    id:
      input.id ??
      notificationId(
        input.category ?? input.entityType,
        input.logicalItemId ?? input.entityId,
        scheduledAt,
      ),
    logical_item_id: input.logicalItemId ?? input.entityId,
    scheduled_at: scheduledAt,
    status: "pending",
    title: input.title,
    user_id: input.userId,
  };
}

export function computeNotificationSchedule(
  entityType: AcademicNotificationCategory,
  scheduledDate: Date,
) {
  return NOTIFICATION_OFFSETS[entityType].map(
    (offset) => new Date(scheduledDate.getTime() - offset * MINUTE_MS),
  );
}

export function getClassOccurrences(record: ClassRecord, now = new Date(), horizonDays = 14) {
  if (!record.is_active || record.deleted_at) {
    return [];
  }

  return getClassOccurrencesForNotifications(record, now, horizonDays);
}

function zonedTimeToDate(dateKey: string, time: string, timeZone: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const desired = Date.UTC(year, month - 1, day, hour, minute);
  const guess = new Date(desired);
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(guess)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)]),
  );
  const observed = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute);
  return new Date(desired + (desired - observed));
}

function dateKeyInTimeZone(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function buildClassNotifications(
  record: ClassRecord,
  now = new Date(),
): Notification[] {
  return getClassOccurrences(record, now).map((occurrence) => {
    const [scheduledAt] = computeNotificationSchedule("class", occurrence);

    return createNotification({
      body: `${record.subject} starts at ${record.start_time}${record.room ? ` in ${record.room}` : ""}.`,
      createdAt: now.toISOString(),
      entityId:
        record.recurrence?.series_id ? `${record.id}:${occurrence.toISOString()}` : record.id,
      entityType: "class",
      scheduledAt,
      title: "Class starts in 30 minutes",
      userId: record.user_id,
    });
  });
}

export function buildAssignmentNotifications(
  record: Assignment,
  now = new Date(),
): Notification[] {
  if (record.deleted_at || record.status === "completed") {
    return [];
  }

  return materializeAssignmentDueDates(record, now)
    .map((dueDate) => new Date(dueDate))
    .filter((dueAt) => Number.isFinite(dueAt.getTime()) && dueAt.getTime() > now.getTime())
    .flatMap((dueAt) =>
      NOTIFICATION_OFFSETS.assignment.map((offset, index) =>
        createNotification({
          body: `"${record.title}" is due ${offsetLabel(offset)} from now.`,
          createdAt: now.toISOString(),
          entityId:
            record.recurrence?.series_id ? `${record.id}:${dueAt.toISOString()}` : record.id,
          entityType: "assignment",
          scheduledAt: computeNotificationSchedule("assignment", dueAt)[index],
          title: `${offsetLabel(offset)} assignment reminder`,
          userId: record.user_id,
        }),
      ),
    );
}

export function buildBudgetAlertNotifications(
  budget: Budget,
  expenses: Expense[],
  now = new Date(),
  timeZone = "UTC",
): Notification[] {
  const today = dateKeyInTimeZone(now, timeZone);
  if (today < budget.start_date || today > budget.end_date || budget.amount <= 0) {
    return [];
  }
  const spent = expenses
    .filter(
      (expense) =>
        !expense.deleted_at &&
        expense.budget_id === budget.id &&
        expense.spent_at >= `${budget.start_date}T00:00:00` &&
        expense.spent_at <= `${budget.end_date}T23:59:59.999`,
    )
    .reduce((sum, expense) => sum + expense.amount, 0);
  const percent = (spent / budget.amount) * 100;

  return [80, 100]
    .filter((threshold) => percent >= threshold)
    .map((threshold) =>
      createNotification({
        body:
          threshold === 100
            ? "You have reached your current budget limit."
            : "You have used at least 80% of your current budget.",
        category: "budget_alert",
        createdAt: now.toISOString(),
        entityId: budget.id,
        entityType: "budget_alert",
        id: `budget_alert:${budget.id}:${threshold}`,
        logicalItemId: `${budget.id}:${threshold}`,
        scheduledAt: now,
        title: threshold === 100 ? "Budget limit reached" : "Budget is running low",
        userId: budget.user_id,
      }),
    );
}

export function buildDailyBriefingNotification(
  userId: string,
  timeZone: string,
  now = new Date(),
): Notification[] {
  const currentKey = dateKeyInTimeZone(now, timeZone);
  let scheduledAt = zonedTimeToDate(currentKey, "07:00", timeZone);
  if (scheduledAt.getTime() <= now.getTime()) {
    const tomorrow = new Date(zonedTimeToDate(currentKey, "12:00", timeZone).getTime() + 86400000);
    scheduledAt = zonedTimeToDate(dateKeyInTimeZone(tomorrow, timeZone), "07:00", timeZone);
  }
  const dateKey = dateKeyInTimeZone(scheduledAt, timeZone);

  return [
    createNotification({
      body: "Open UniLife to review your schedule, deadlines, and budget.",
      category: "daily_briefing",
      createdAt: now.toISOString(),
      entityId: dateKey,
      entityType: "daily_briefing",
      id: `daily_briefing:${dateKey}`,
      logicalItemId: dateKey,
      scheduledAt,
      title: "Your daily briefing is ready",
      userId,
    }),
  ];
}

export function buildExamNotifications(
  record: Exam,
  now = new Date(),
): Notification[] {
  if (record.deleted_at) {
    return [];
  }

  const examAt = new Date(record.exam_date);
  if (!Number.isFinite(examAt.getTime()) || examAt.getTime() <= now.getTime()) {
    return [];
  }

  return NOTIFICATION_OFFSETS.exam.map((offset, index) =>
    createNotification({
      body: `"${record.title}" is ${offsetLabel(offset)} away${record.location ? ` at ${record.location}` : ""}.`,
      createdAt: now.toISOString(),
      entityId: record.id,
      entityType: "exam",
      scheduledAt: computeNotificationSchedule("exam", examAt)[index],
      title: `${offsetLabel(offset)} exam reminder`,
      userId: record.user_id,
    }),
  );
}

export function buildEntityNotifications(
  entityType: AcademicNotificationCategory,
  record: Assignment | ClassRecord | Exam,
  now = new Date(),
) {
  if (entityType === "assignment") {
    return buildAssignmentNotifications(record as Assignment, now);
  }
  if (entityType === "exam") {
    return buildExamNotifications(record as Exam, now);
  }
  return buildClassNotifications(record as ClassRecord, now);
}

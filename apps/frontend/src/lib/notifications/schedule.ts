import type {
  Assignment,
  ClassRecord,
  Exam,
  Notification,
  NotificationEntityType,
} from "@unilife-ai/types";

const MINUTE_MS = 60 * 1000;
const DAY_MS = 24 * 60 * MINUTE_MS;

export const NOTIFICATION_OFFSETS = {
  class: [30],
  assignment: [7 * 1440, 3 * 1440, 1440, 180],
  exam: [14 * 1440, 7 * 1440, 3 * 1440, 1440],
} as const;

const DAY_INDEX: Record<ClassRecord["day_of_week"], number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

function notificationId(
  entityType: NotificationEntityType,
  entityId: string,
  scheduledAt: string,
) {
  return `${entityType}:${entityId}:${scheduledAt}`;
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
  scheduledAt: Date;
  title: string;
  userId: string;
}): Notification {
  const scheduledAt = input.scheduledAt.toISOString();

  return {
    body: input.body,
    created_at: input.createdAt,
    entity_id: input.entityId,
    entity_type: input.entityType,
    id: notificationId(input.entityType, input.entityId, scheduledAt),
    scheduled_at: scheduledAt,
    status: "pending",
    title: input.title,
    user_id: input.userId,
  };
}

export function computeNotificationSchedule(
  entityType: NotificationEntityType,
  scheduledDate: Date,
) {
  return NOTIFICATION_OFFSETS[entityType].map(
    (offset) => new Date(scheduledDate.getTime() - offset * MINUTE_MS),
  );
}

export function getClassOccurrences(
  record: ClassRecord,
  now = new Date(),
  horizonDays = 14,
) {
  if (!record.is_active || record.deleted_at) {
    return [];
  }

  const [hours, minutes] = record.start_time.split(":").map(Number);
  const end = new Date(now.getTime() + horizonDays * DAY_MS);
  const first = new Date(now);
  first.setHours(hours, minutes, 0, 0);
  const daysAhead = (DAY_INDEX[record.day_of_week] - first.getDay() + 7) % 7;
  first.setDate(first.getDate() + daysAhead);

  if (first.getTime() <= now.getTime()) {
    first.setDate(first.getDate() + 7);
  }

  const occurrences: Date[] = [];
  for (
    let occurrence = first;
    occurrence.getTime() <= end.getTime();
    occurrence = new Date(occurrence.getTime() + 7 * DAY_MS)
  ) {
    occurrences.push(new Date(occurrence));
  }

  return occurrences;
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
      entityId: record.id,
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

  const dueAt = new Date(record.due_date);
  if (!Number.isFinite(dueAt.getTime()) || dueAt.getTime() <= now.getTime()) {
    return [];
  }

  return NOTIFICATION_OFFSETS.assignment.map((offset, index) =>
    createNotification({
      body: `"${record.title}" is due ${offsetLabel(offset)} from now.`,
      createdAt: now.toISOString(),
      entityId: record.id,
      entityType: "assignment",
      scheduledAt: computeNotificationSchedule("assignment", dueAt)[index],
      title: `${offsetLabel(offset)} assignment reminder`,
      userId: record.user_id,
    }),
  );
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
  entityType: NotificationEntityType,
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


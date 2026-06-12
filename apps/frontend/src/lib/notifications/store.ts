import type {
  Assignment,
  ClassRecord,
  Exam,
  Notification,
  NotificationEntityType,
} from "@unilife-ai/types";

import { db } from "@/lib/db/dexie";
import { buildEntityNotifications } from "@/lib/notifications/schedule";

type AcademicRecord = Assignment | ClassRecord | Exam;

export function mergeNotificationSchedules(
  existing: Notification[],
  desired: Notification[],
) {
  const existingById = new Map(existing.map((item) => [item.id, item]));

  return desired.map((item) => {
    const previous = existingById.get(item.id);

    return previous
      ? {
          ...item,
          created_at: previous.created_at,
          status: previous.status,
        }
      : item;
  });
}

export async function replaceEntityNotifications(
  entityType: NotificationEntityType,
  record: AcademicRecord,
  now = new Date(),
) {
  const existing = await db.notifications
    .where("entity_id")
    .equals(record.id)
    .and((notification) => notification.entity_type === entityType)
    .toArray();
  const desired = mergeNotificationSchedules(
    existing,
    buildEntityNotifications(entityType, record, now),
  );

  await db.notifications.bulkDelete(existing.map((item) => item.id));
  if (desired.length > 0) {
    await db.notifications.bulkPut(desired);
  }
}

export async function deleteEntityNotifications(
  entityType: NotificationEntityType,
  entityId: string,
) {
  const existing = await db.notifications
    .where("entity_id")
    .equals(entityId)
    .and((notification) => notification.entity_type === entityType)
    .primaryKeys();

  await db.notifications.bulkDelete(existing);
}

export async function reconcileAllNotifications(userId: string, now = new Date()) {
  const [classes, assignments, exams, existing] = await Promise.all([
    db.classes.where("user_id").equals(userId).toArray(),
    db.assignments.where("user_id").equals(userId).toArray(),
    db.exams.where("user_id").equals(userId).toArray(),
    db.notifications.where("user_id").equals(userId).toArray(),
  ]);
  const desired = [
    ...classes.flatMap((record) => buildEntityNotifications("class", record, now)),
    ...assignments.flatMap((record) =>
      buildEntityNotifications("assignment", record, now),
    ),
    ...exams.flatMap((record) => buildEntityNotifications("exam", record, now)),
  ];
  const merged = mergeNotificationSchedules(existing, desired);

  await db.transaction("rw", db.notifications, async () => {
    await db.notifications.bulkDelete(existing.map((item) => item.id));
    if (merged.length > 0) {
      await db.notifications.bulkPut(merged);
    }
  });

  return merged;
}


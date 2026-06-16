import type {
  Assignment,
  ClassRecord,
  Exam,
  Notification,
  NotificationSettings,
} from "@unilife-ai/types";

import { db } from "@/lib/db/dexie";
import {
  buildBudgetAlertNotifications,
  buildDailyBriefingNotification,
  buildEntityNotifications,
} from "@/lib/notifications/schedule";
import {
  getCachedNotificationSettings,
  getCategoryPreference,
} from "@/lib/notifications/preferences";

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

export function applyNotificationPreferences(
  desired: Notification[],
  settings: NotificationSettings,
) {
  const enabled = desired.filter((item) =>
    getCategoryPreference(settings, item.category ?? item.entity_type).enabled,
  );
  const groups = new Map<string, Notification[]>();

  for (const item of enabled) {
    const category = item.category ?? item.entity_type;
    const logicalItemId = item.logical_item_id ?? item.entity_id;
    const key = `${category}:${logicalItemId}`;
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }

  return Array.from(groups.values()).flatMap((items) => {
    const category = items[0].category ?? items[0].entity_type;
    const limit = getCategoryPreference(settings, category).escalation_limit;
    if (limit === 0) return [];
    return items
      .sort((left, right) => left.scheduled_at.localeCompare(right.scheduled_at))
      .slice(-limit);
  });
}

export async function replaceEntityNotifications(
  entityType: "class" | "assignment" | "exam",
  record: AcademicRecord,
  now = new Date(),
) {
  const existing = await db.notifications
    .where("user_id")
    .equals(record.user_id)
    .and(
      (notification) =>
        notification.entity_type === entityType &&
        (notification.entity_id === record.id ||
          notification.entity_id.startsWith(`${record.id}:`)),
    )
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
  entityType: "class" | "assignment" | "exam",
  entityId: string,
) {
  const existing = await db.notifications
    .where("entity_type")
    .equals(entityType)
    .and(
      (notification) =>
        notification.entity_id === entityId ||
        notification.entity_id.startsWith(`${entityId}:`),
    )
    .primaryKeys();

  await db.notifications.bulkDelete(existing);
}

export async function reconcileAllNotifications(userId: string, now = new Date()) {
  const [classes, assignments, exams, budgets, expenses, existing, settings] = await Promise.all([
    db.classes.where("user_id").equals(userId).toArray(),
    db.assignments.where("user_id").equals(userId).toArray(),
    db.exams.where("user_id").equals(userId).toArray(),
    db.budgets.where("user_id").equals(userId).toArray(),
    db.expenses.where("user_id").equals(userId).toArray(),
    db.notifications.where("user_id").equals(userId).toArray(),
    getCachedNotificationSettings(userId),
  ]);
  const desired = applyNotificationPreferences([
    ...classes.flatMap((record) => buildEntityNotifications("class", record, now)),
    ...assignments.flatMap((record) =>
      buildEntityNotifications("assignment", record, now),
    ),
    ...exams.flatMap((record) => buildEntityNotifications("exam", record, now)),
    ...budgets.flatMap((record) =>
      buildBudgetAlertNotifications(record, expenses, now, settings.timezone),
    ),
    ...buildDailyBriefingNotification(userId, settings.timezone, now),
  ], settings);
  const merged = mergeNotificationSchedules(existing, desired);

  await db.transaction("rw", db.notifications, async () => {
    await db.notifications.bulkDelete(existing.map((item) => item.id));
    if (merged.length > 0) {
      await db.notifications.bulkPut(merged);
    }
  });

  return merged;
}


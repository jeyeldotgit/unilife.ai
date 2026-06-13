"use client";

import { db } from "@/lib/db/dexie";
import { getCurrentUserId } from "@/lib/session/current-user";
import { normalizeAssignmentRecord } from "@/lib/selectors/assignments";
import { useLiveQueryValue } from "@/hooks/use-live-query";
import { useSyncStatus } from "@/hooks/use-sync-status";

export function useAssignments() {
  const syncStatus = useSyncStatus();
  const userId = getCurrentUserId();
  const assignmentsQuery = useLiveQueryValue(
    async () => {
      if (!userId) {
        return [];
      }

      return db.assignments
        .where("user_id")
        .equals(userId)
        .and((record) => record.deleted_at === null)
        .toArray();
    },
    [],
  );
  const classesQuery = useLiveQueryValue(
    async () => {
      if (!userId) {
        return [];
      }

      return db.classes
        .where("user_id")
        .equals(userId)
        .and((record) => record.deleted_at === null)
        .toArray();
    },
    [],
  );
  const notificationsQuery = useLiveQueryValue(
    async () => {
      if (!userId) return [];
      return db.notifications.where("user_id").equals(userId).toArray();
    },
    [],
  );
  const classSubjectById = new Map(
    classesQuery.value.map((record) => [record.id, record.subject] as const),
  );

  return {
    assignments: assignmentsQuery.value.map((record) =>
      normalizeAssignmentRecord(record, {
        classSubjectById,
        notifications: notificationsQuery.value.filter(
          (notification) =>
            notification.entity_type === "assignment" &&
            notification.entity_id === record.id,
        ),
      }),
    ),
    available: syncStatus.ready || assignmentsQuery.value.length > 0,
    loaded:
      assignmentsQuery.loaded && classesQuery.loaded && notificationsQuery.loaded,
  };
}

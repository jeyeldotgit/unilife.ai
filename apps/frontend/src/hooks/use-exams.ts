"use client";

import { db } from "@/lib/db/dexie";
import { getCurrentUserId } from "@/lib/session/current-user";
import { normalizeExamRecord } from "@/lib/selectors/exams";
import { buildClassOptions } from "@/lib/selectors/schedule";
import { useLiveQueryValue } from "@/hooks/use-live-query";
import { useSyncStatus } from "@/hooks/use-sync-status";

export function useExams() {
  const syncStatus = useSyncStatus();
  const userId = getCurrentUserId();
  const examsQuery = useLiveQueryValue(
    async () => {
      if (!userId) {
        return [];
      }

      return db.exams
        .where("user_id")
        .equals(userId)
        .and((record) => record.deleted_at === null)
        .toArray();
    },
    [],
    [userId],
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
    [userId],
  );
  const notificationsQuery = useLiveQueryValue(
    async () => {
      if (!userId) return [];
      return db.notifications.where("user_id").equals(userId).toArray();
    },
    [],
    [userId],
  );
  const classSubjectById = new Map(
    classesQuery.value.map((record) => [record.id, record.subject] as const),
  );

  return {
    available: syncStatus.ready || examsQuery.value.length > 0,
    classOptions: buildClassOptions(classesQuery.value),
    classesAvailable: syncStatus.ready || classesQuery.value.length > 0,
    exams: examsQuery.value.map((record) =>
      normalizeExamRecord(record, {
        classSubjectById,
        notifications: notificationsQuery.value.filter(
          (notification) =>
            notification.entity_type === "exam" &&
            notification.entity_id === record.id,
        ),
      }),
    ),
    loaded: examsQuery.loaded && classesQuery.loaded && notificationsQuery.loaded,
  };
}

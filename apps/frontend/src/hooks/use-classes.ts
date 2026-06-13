"use client";

import { db } from "@/lib/db/dexie";
import { buildClassOptions, buildScheduleWeekSnapshot } from "@/lib/selectors/schedule";
import { useCurrentUserId } from "@/hooks/use-current-user-id";
import { useLiveQueryValue } from "@/hooks/use-live-query";
import { useSyncStatus } from "@/hooks/use-sync-status";

export function useClasses() {
  const syncStatus = useSyncStatus();
  const userId = useCurrentUserId();
  const classQuery = useLiveQueryValue(
    async () => {
      if (!userId) {
        return [];
      }

      return db.classes
        .where("user_id")
        .equals(userId)
        .and((record) => record.deleted_at === null && record.is_active)
        .toArray();
    },
    [],
    [userId],
  );
  const assignmentQuery = useLiveQueryValue(
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
  const scheduleWeek = buildScheduleWeekSnapshot(
    classQuery.value,
    assignmentQuery.value,
    notificationsQuery.value,
  );

  return {
    available: syncStatus.ready || classQuery.value.length > 0,
    classOptions: buildClassOptions(classQuery.value),
    loaded:
      classQuery.loaded && assignmentQuery.loaded && notificationsQuery.loaded,
    records: classQuery.value,
    scheduleWeek,
  };
}

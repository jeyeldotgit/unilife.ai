"use client";

import { useCallback } from "react";

import { db } from "@/lib/db/dexie";
import { buildClassOptions, buildScheduleWeekSnapshot } from "@/lib/selectors/schedule";
import { useCurrentUserId } from "@/hooks/use-current-user-id";
import { useLiveQueryValue } from "@/hooks/use-live-query";
import { useSyncStatus } from "@/hooks/use-sync-status";
import { notifySyncMutationQueued } from "@/lib/sync/mutation-signal";

function getActiveTerm<T extends { status: string; deleted_at: string | null; updated_at: string }>(
  terms: T[],
) {
  return (
    terms
      .filter((term) => term.status === "active" && term.deleted_at === null)
      .sort((left, right) => right.updated_at.localeCompare(left.updated_at))[0] ?? null
  );
}

export function useClasses() {
  const syncStatus = useSyncStatus();
  const userId = useCurrentUserId();
  const refresh = useCallback(async () => {
    if (userId) {
      notifySyncMutationQueued();
    }
  }, [userId]);
  const termsQuery = useLiveQueryValue(
    async () => {
      if (!userId) return [];
      return db.academic_terms
        .where("user_id")
        .equals(userId)
        .and((term) => term.deleted_at === null)
        .toArray();
    },
    [],
    [userId],
  );
  const classesQuery = useLiveQueryValue(
    async () => {
      if (!userId) return [];
      return db.classes
        .where("user_id")
        .equals(userId)
        .and((record) => record.deleted_at === null && record.is_active)
        .toArray();
    },
    [],
    [userId],
  );
  const terms = termsQuery.value;
  const classRecords = classesQuery.value;

  const activeTerms = terms.filter(
    (term) => term.status === "active" && term.deleted_at === null,
  );
  const activeTerm = getActiveTerm(terms);
  const activeTermIds = new Set(activeTerms.map((term) => term.id));
  const visibleClassRecords =
    activeTermIds.size > 0
      ? classRecords.filter(
          (record) => typeof record.term_id === "string" && activeTermIds.has(record.term_id),
        )
      : classRecords.filter(
          (record) => record.term_id === null || record.term_id === undefined,
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
    visibleClassRecords,
    assignmentQuery.value,
    notificationsQuery.value,
  );

  return {
    activeTerm,
    activeTerms,
    available: syncStatus.ready || visibleClassRecords.length > 0,
    classOptions: buildClassOptions(visibleClassRecords),
    error: syncStatus.phase === "failed" ? "Schedule changes are saved locally, but sync needs attention." : null,
    loaded:
      termsQuery.loaded &&
      classesQuery.loaded &&
      assignmentQuery.loaded &&
      notificationsQuery.loaded,
    records: visibleClassRecords,
    refresh,
    terms,
    scheduleWeek,
  };
}

"use client";

import { useCallback, useEffect, useState } from "react";
import type { AcademicTerm, ClassRecord } from "@unilife-ai/types";

import {
  listAcademicTermsOnline,
  listClassRecordsOnline,
} from "@/lib/api/schedule-online";
import { db } from "@/lib/db/dexie";
import { buildClassOptions, buildScheduleWeekSnapshot } from "@/lib/selectors/schedule";
import { useCurrentUserId } from "@/hooks/use-current-user-id";
import { useLiveQueryValue } from "@/hooks/use-live-query";

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
  const userId = useCurrentUserId();
  const [terms, setTerms] = useState<AcademicTerm[]>([]);
  const [classRecords, setClassRecords] = useState<ClassRecord[]>([]);
  const [loadedOnline, setLoadedOnline] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const refresh = useCallback(async () => {
    if (!userId) {
      setTerms([]);
      setClassRecords([]);
      setLoadedOnline(false);
      return;
    }

    try {
      const [nextTerms, nextClassRecords] = await Promise.all([
        listAcademicTermsOnline(),
        listClassRecordsOnline(),
      ]);
      setTerms(nextTerms);
      setClassRecords(nextClassRecords);
      setError(null);
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "Schedule data could not be loaded.",
      );
    } finally {
      setLoadedOnline(true);
    }
  }, [userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

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
    available: loadedOnline || visibleClassRecords.length > 0,
    classOptions: buildClassOptions(visibleClassRecords),
    error,
    loaded:
      loadedOnline &&
      assignmentQuery.loaded &&
      notificationsQuery.loaded,
    records: visibleClassRecords,
    refresh,
    terms,
    scheduleWeek,
  };
}

"use client";

import { useCallback, useEffect, useState } from "react";
import type { StudyKit, StudyKitDetail } from "@unilife-ai/types";

import { useCurrentUserId } from "@/hooks/use-current-user-id";
import { useLiveQueryValue } from "@/hooks/use-live-query";
import { db } from "@/lib/db/dexie";
import { getStudyKit, listStudyKits } from "@/lib/api/study-kits";

async function cacheStudyKitDetail(kit: StudyKitDetail) {
  await db.study_kits.put(kit);
  if (kit.flashcards.length > 0) {
    await db.study_flashcards.bulkPut(kit.flashcards);
  }
  if (kit.questions.length > 0) {
    await db.study_quiz_questions.bulkPut(
      kit.questions.map(({ options: _options, ...question }) => question),
    );
    const options = kit.questions.flatMap((question) => question.options);
    if (options.length > 0) {
      await db.study_quiz_options.bulkPut(options);
    }
  }
  if (kit.attempts.length > 0) {
    await db.study_quiz_attempts.bulkPut(kit.attempts);
  }
  if (kit.card_reviews.length > 0) {
    await db.study_card_reviews.bulkPut(kit.card_reviews);
  }
}

export function useStudyKits() {
  const userId = useCurrentUserId();
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const kitsQuery = useLiveQueryValue(
    async () => {
      if (!userId) return [];
      return db.study_kits
        .where("user_id")
        .equals(userId)
        .reverse()
        .sortBy("updated_at");
    },
    [],
    [userId],
  );

  const refresh = useCallback(async () => {
    if (!userId) return;
    setRefreshing(true);
    setError(null);
    try {
      const response = await listStudyKits();
      await db.study_kits.bulkPut(response.kits);
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : "Study kits could not load.");
    } finally {
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    error,
    kits: kitsQuery.value,
    loaded: kitsQuery.loaded && !refreshing,
    refresh,
    refreshing,
  };
}

export function useStudyKit(id: string) {
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const kitQuery = useLiveQueryValue(
    async () => {
      const kit = await db.study_kits.get(id);
      if (!kit) return null;
      const [flashcards, questions, attempts, reviews] = await Promise.all([
        db.study_flashcards.where("study_kit_id").equals(id).sortBy("order_index"),
        db.study_quiz_questions.where("study_kit_id").equals(id).sortBy("order_index"),
        db.study_quiz_attempts.where("study_kit_id").equals(id).reverse().sortBy("created_at"),
        db.study_card_reviews.where("study_kit_id").equals(id).toArray(),
      ]);
      const optionsByQuestion = new Map<string, StudyKitDetail["questions"][number]["options"]>();
      const questionIds = questions.map((question) => question.id);
      const options =
        questionIds.length > 0
          ? await db.study_quiz_options.where("question_id").anyOf(questionIds).toArray()
          : [];
      for (const option of options) {
        const current = optionsByQuestion.get(option.question_id) ?? [];
        current.push(option);
        optionsByQuestion.set(option.question_id, current);
      }

      return {
        ...kit,
        flashcards,
        questions: questions.map((question) => ({
          ...question,
          options: (optionsByQuestion.get(question.id) ?? []).sort(
            (left, right) => left.order_index - right.order_index,
          ),
        })),
        attempts,
        card_reviews: reviews,
      } satisfies StudyKitDetail;
    },
    null,
    [id],
  );
  const refresh = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    try {
      const response = await getStudyKit(id);
      await cacheStudyKitDetail(response.kit);
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : "Study kit could not load.");
    } finally {
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    error,
    kit: kitQuery.value,
    loaded: kitQuery.loaded && !refreshing,
    refresh,
    refreshing,
  };
}

export async function cacheCreatedStudyKit(kit: StudyKitDetail) {
  await cacheStudyKitDetail(kit);
}

export async function removeCachedStudyKit(id: string) {
  const questions = await db.study_quiz_questions.where("study_kit_id").equals(id).toArray();
  const questionIds = questions.map((question) => question.id);

  await db.transaction(
    "rw",
    [
      db.study_kits,
      db.study_flashcards,
      db.study_quiz_questions,
      db.study_quiz_options,
      db.study_quiz_attempts,
      db.study_card_reviews,
    ],
    async () => {
      await db.study_kits.delete(id);
      await db.study_flashcards.where("study_kit_id").equals(id).delete();
      await db.study_quiz_questions.where("study_kit_id").equals(id).delete();
      await db.study_quiz_attempts.where("study_kit_id").equals(id).delete();
      await db.study_card_reviews.where("study_kit_id").equals(id).delete();
      if (questionIds.length > 0) {
        await db.study_quiz_options.where("question_id").anyOf(questionIds).delete();
      }
    },
  );
}

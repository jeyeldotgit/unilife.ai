import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  StudyCardReview,
  StudyFlashcard,
  StudyKit,
  StudyKitDetail,
  StudyQuizAnswerOption,
  StudyQuizAttempt,
  StudyQuizQuestion,
} from "@unilife-ai/types";

import { validationError } from "../lib/http-errors.js";

type GeneratedStudyContent = {
  flashcards: StudyFlashcard[];
  options: StudyQuizAnswerOption[];
  questions: StudyQuizQuestion[];
};

function toStudyKitStorageError(error: { message: string }) {
  const message = error.message.toLowerCase();
  if (
    message.includes("study_kits") ||
    message.includes("study_flashcards") ||
    message.includes("study_quiz") ||
    message.includes("study_card_reviews") ||
    message.includes("source_path") ||
    message.includes("source_deleted_at")
  ) {
    return validationError(
      "Study Kit tables are not ready. Apply the latest database migrations, including 0011_study_kit_storage_sources.sql.",
      error.message,
    );
  }

  return new Error(error.message);
}

export class StudyKitsRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async findByFingerprintForUser(sourceFingerprint: string, userId: string) {
    const { data, error } = await this.supabase
      .from("study_kits")
      .select("*")
      .eq("source_fingerprint", sourceFingerprint)
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw toStudyKitStorageError(error);
    return (data as StudyKit | null) ?? null;
  }

  async findByIdForUser(id: string, userId: string) {
    const { data, error } = await this.supabase
      .from("study_kits")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw toStudyKitStorageError(error);
    return (data as StudyKit | null) ?? null;
  }

  async listForUser(userId: string) {
    const { data, error } = await this.supabase
      .from("study_kits")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    if (error) throw toStudyKitStorageError(error);
    return (data ?? []) as StudyKit[];
  }

  async upsertKit(record: StudyKit) {
    const { data, error } = await this.supabase
      .from("study_kits")
      .upsert(record)
      .select()
      .single();

    if (error) throw toStudyKitStorageError(error);
    return data as StudyKit;
  }

  async saveGeneratedContent(content: GeneratedStudyContent) {
    if (content.flashcards.length > 0) {
      const { error } = await this.supabase.from("study_flashcards").insert(content.flashcards);
      if (error) throw toStudyKitStorageError(error);
    }

    if (content.questions.length > 0) {
      const { error } = await this.supabase
        .from("study_quiz_questions")
        .insert(content.questions);
      if (error) throw toStudyKitStorageError(error);
    }

    if (content.options.length > 0) {
      const { error } = await this.supabase.from("study_quiz_options").insert(content.options);
      if (error) throw toStudyKitStorageError(error);
    }
  }

  async getDetail(kit: StudyKit): Promise<StudyKitDetail> {
    const [flashcardsResult, questionsResult, attemptsResult, reviewsResult] =
      await Promise.all([
        this.supabase
          .from("study_flashcards")
          .select("*")
          .eq("study_kit_id", kit.id)
          .order("order_index", { ascending: true }),
        this.supabase
          .from("study_quiz_questions")
          .select("*, study_quiz_options(*)")
          .eq("study_kit_id", kit.id)
          .order("order_index", { ascending: true }),
        this.supabase
          .from("study_quiz_attempts")
          .select("*")
          .eq("study_kit_id", kit.id)
          .eq("user_id", kit.user_id)
          .order("created_at", { ascending: false }),
        this.supabase
          .from("study_card_reviews")
          .select("*")
          .eq("study_kit_id", kit.id)
          .eq("user_id", kit.user_id),
      ]);

    if (flashcardsResult.error) throw toStudyKitStorageError(flashcardsResult.error);
    if (questionsResult.error) throw toStudyKitStorageError(questionsResult.error);
    if (attemptsResult.error) throw toStudyKitStorageError(attemptsResult.error);
    if (reviewsResult.error) throw toStudyKitStorageError(reviewsResult.error);

    const questions = ((questionsResult.data ?? []) as Array<
      StudyQuizQuestion & { study_quiz_options?: StudyQuizAnswerOption[] }
    >).map((question) => {
      const { study_quiz_options: options = [], ...rest } = question;
      return {
        ...rest,
        options: [...options].sort((left, right) => left.order_index - right.order_index),
      };
    });

    return {
      ...kit,
      flashcards: (flashcardsResult.data ?? []) as StudyFlashcard[],
      questions,
      attempts: (attemptsResult.data ?? []) as StudyQuizAttempt[],
      card_reviews: (reviewsResult.data ?? []) as StudyCardReview[],
    };
  }

  async deleteKit(id: string, userId: string) {
    const { error } = await this.supabase
      .from("study_kits")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) throw toStudyKitStorageError(error);
  }

  async createQuizAttempt(record: StudyQuizAttempt) {
    const { data, error } = await this.supabase
      .from("study_quiz_attempts")
      .insert(record)
      .select()
      .single();

    if (error) throw toStudyKitStorageError(error);
    return data as StudyQuizAttempt;
  }

  async upsertCardReview(record: StudyCardReview) {
    const { data, error } = await this.supabase
      .from("study_card_reviews")
      .upsert(record, { onConflict: "user_id,flashcard_id" })
      .select()
      .single();

    if (error) throw toStudyKitStorageError(error);
    return data as StudyCardReview;
  }
}

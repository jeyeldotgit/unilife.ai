export type StudyKitStatus = "processing" | "ready" | "failed";

export type StudyCardReviewState = "seen" | "known" | "needs_review";

export type StudyQuizAnswerOption = {
  id: string;
  question_id: string;
  text: string;
  is_correct: boolean;
  rationale: string;
  order_index: number;
  created_at: string;
};

export type StudyQuizQuestion = {
  id: string;
  study_kit_id: string;
  question: string;
  hint: string | null;
  order_index: number;
  created_at: string;
  options?: StudyQuizAnswerOption[];
};

export type StudyFlashcard = {
  id: string;
  study_kit_id: string;
  lesson: string;
  front: string;
  back: string;
  order_index: number;
  created_at: string;
};

export type StudyQuizAttempt = {
  id: string;
  study_kit_id: string;
  user_id: string;
  score: number;
  total: number;
  answers: Record<string, string>;
  created_at: string;
};

export type StudyCardReview = {
  id: string;
  study_kit_id: string;
  flashcard_id: string;
  user_id: string;
  state: StudyCardReviewState;
  updated_at: string;
};

export type StudyKit = {
  id: string;
  user_id: string;
  class_id: string | null;
  exam_id: string | null;
  title: string;
  source_name: string;
  source_path: string | null;
  source_deleted_at: string | null;
  source_fingerprint: string;
  status: StudyKitStatus;
  flashcard_count: number;
  quiz_question_count: number;
  extracted_text_preview: string | null;
  error: string | null;
  created_at: string;
  updated_at: string;
};

export type StudyKitDetail = StudyKit & {
  flashcards: StudyFlashcard[];
  questions: Array<StudyQuizQuestion & { options: StudyQuizAnswerOption[] }>;
  attempts: StudyQuizAttempt[];
  card_reviews: StudyCardReview[];
};

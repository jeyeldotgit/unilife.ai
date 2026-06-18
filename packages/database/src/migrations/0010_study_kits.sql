CREATE TABLE IF NOT EXISTS "study_kits" (
  "id" uuid PRIMARY KEY NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "class_id" uuid REFERENCES "classes"("id") ON DELETE set null,
  "exam_id" uuid REFERENCES "exams"("id") ON DELETE set null,
  "title" text NOT NULL,
  "source_name" text NOT NULL,
  "source_path" text,
  "source_deleted_at" timestamp with time zone,
  "source_fingerprint" text NOT NULL,
  "status" text NOT NULL,
  "flashcard_count" integer DEFAULT 0 NOT NULL,
  "quiz_question_count" integer DEFAULT 0 NOT NULL,
  "extracted_text_preview" text,
  "error" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "study_flashcards" (
  "id" uuid PRIMARY KEY NOT NULL,
  "study_kit_id" uuid NOT NULL REFERENCES "study_kits"("id") ON DELETE cascade,
  "lesson" text NOT NULL,
  "front" text NOT NULL,
  "back" text NOT NULL,
  "order_index" integer NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "study_quiz_questions" (
  "id" uuid PRIMARY KEY NOT NULL,
  "study_kit_id" uuid NOT NULL REFERENCES "study_kits"("id") ON DELETE cascade,
  "question" text NOT NULL,
  "hint" text,
  "order_index" integer NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "study_quiz_options" (
  "id" uuid PRIMARY KEY NOT NULL,
  "question_id" uuid NOT NULL REFERENCES "study_quiz_questions"("id") ON DELETE cascade,
  "text" text NOT NULL,
  "is_correct" boolean NOT NULL,
  "rationale" text NOT NULL,
  "order_index" integer NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "study_quiz_attempts" (
  "id" uuid PRIMARY KEY NOT NULL,
  "study_kit_id" uuid NOT NULL REFERENCES "study_kits"("id") ON DELETE cascade,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "score" integer NOT NULL,
  "total" integer NOT NULL,
  "answers" jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "study_card_reviews" (
  "id" uuid PRIMARY KEY NOT NULL,
  "study_kit_id" uuid NOT NULL REFERENCES "study_kits"("id") ON DELETE cascade,
  "flashcard_id" uuid NOT NULL REFERENCES "study_flashcards"("id") ON DELETE cascade,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "state" text NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "study_kits_user_source_fingerprint_unique" ON "study_kits" ("user_id", "source_fingerprint");
CREATE INDEX IF NOT EXISTS "study_kits_user_updated_at_idx" ON "study_kits" ("user_id", "updated_at");
CREATE INDEX IF NOT EXISTS "study_kits_user_status_updated_at_idx" ON "study_kits" ("user_id", "status", "updated_at");
CREATE INDEX IF NOT EXISTS "study_flashcards_kit_order_idx" ON "study_flashcards" ("study_kit_id", "order_index");
CREATE INDEX IF NOT EXISTS "study_quiz_questions_kit_order_idx" ON "study_quiz_questions" ("study_kit_id", "order_index");
CREATE INDEX IF NOT EXISTS "study_quiz_options_question_order_idx" ON "study_quiz_options" ("question_id", "order_index");
CREATE INDEX IF NOT EXISTS "study_quiz_attempts_kit_created_at_idx" ON "study_quiz_attempts" ("study_kit_id", "created_at");
CREATE UNIQUE INDEX IF NOT EXISTS "study_card_reviews_user_card_unique" ON "study_card_reviews" ("user_id", "flashcard_id");
CREATE INDEX IF NOT EXISTS "study_card_reviews_kit_user_idx" ON "study_card_reviews" ("study_kit_id", "user_id");

INSERT INTO storage.buckets (id, name, public)
VALUES ('study-kit-sources', 'study-kit-sources', false)
ON CONFLICT (id) DO UPDATE
SET public = excluded.public;

CREATE POLICY "Users can upload own study kit sources"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'study-kit-sources'
  AND (storage.foldername(name))[1] = 'study-kits'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

CREATE POLICY "Users can read own study kit sources"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'study-kit-sources'
  AND (storage.foldername(name))[1] = 'study-kits'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

CREATE POLICY "Users can delete own study kit sources"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'study-kit-sources'
  AND (storage.foldername(name))[1] = 'study-kits'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

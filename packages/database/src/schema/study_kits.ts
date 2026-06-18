import {
  index,
  integer,
  boolean,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { classes } from "./classes.js";
import { exams } from "./exams.js";
import { users } from "./users.js";

export const studyKits = pgTable(
  "study_kits",
  {
    id: uuid("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    classId: uuid("class_id").references(() => classes.id, { onDelete: "set null" }),
    examId: uuid("exam_id").references(() => exams.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    sourceName: text("source_name").notNull(),
    sourcePath: text("source_path"),
    sourceDeletedAt: timestamp("source_deleted_at", { withTimezone: true }),
    sourceFingerprint: text("source_fingerprint").notNull(),
    status: text("status").notNull(),
    flashcardCount: integer("flashcard_count").notNull().default(0),
    quizQuestionCount: integer("quiz_question_count").notNull().default(0),
    extractedTextPreview: text("extracted_text_preview"),
    error: text("error"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("study_kits_user_source_fingerprint_unique").on(
      table.userId,
      table.sourceFingerprint,
    ),
    index("study_kits_user_updated_at_idx").on(table.userId, table.updatedAt),
    index("study_kits_user_status_updated_at_idx").on(
      table.userId,
      table.status,
      table.updatedAt,
    ),
  ],
);

export const studyFlashcards = pgTable(
  "study_flashcards",
  {
    id: uuid("id").primaryKey(),
    studyKitId: uuid("study_kit_id")
      .notNull()
      .references(() => studyKits.id, { onDelete: "cascade" }),
    lesson: text("lesson").notNull(),
    front: text("front").notNull(),
    back: text("back").notNull(),
    orderIndex: integer("order_index").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("study_flashcards_kit_order_idx").on(table.studyKitId, table.orderIndex)],
);

export const studyQuizQuestions = pgTable(
  "study_quiz_questions",
  {
    id: uuid("id").primaryKey(),
    studyKitId: uuid("study_kit_id")
      .notNull()
      .references(() => studyKits.id, { onDelete: "cascade" }),
    question: text("question").notNull(),
    hint: text("hint"),
    orderIndex: integer("order_index").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("study_quiz_questions_kit_order_idx").on(table.studyKitId, table.orderIndex)],
);

export const studyQuizOptions = pgTable(
  "study_quiz_options",
  {
    id: uuid("id").primaryKey(),
    questionId: uuid("question_id")
      .notNull()
      .references(() => studyQuizQuestions.id, { onDelete: "cascade" }),
    text: text("text").notNull(),
    isCorrect: boolean("is_correct").notNull(),
    rationale: text("rationale").notNull(),
    orderIndex: integer("order_index").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("study_quiz_options_question_order_idx").on(table.questionId, table.orderIndex)],
);

export const studyQuizAttempts = pgTable(
  "study_quiz_attempts",
  {
    id: uuid("id").primaryKey(),
    studyKitId: uuid("study_kit_id")
      .notNull()
      .references(() => studyKits.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    score: integer("score").notNull(),
    total: integer("total").notNull(),
    answers: jsonb("answers").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("study_quiz_attempts_kit_created_at_idx").on(table.studyKitId, table.createdAt)],
);

export const studyCardReviews = pgTable(
  "study_card_reviews",
  {
    id: uuid("id").primaryKey(),
    studyKitId: uuid("study_kit_id")
      .notNull()
      .references(() => studyKits.id, { onDelete: "cascade" }),
    flashcardId: uuid("flashcard_id")
      .notNull()
      .references(() => studyFlashcards.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    state: text("state").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("study_card_reviews_user_card_unique").on(table.userId, table.flashcardId),
    index("study_card_reviews_kit_user_idx").on(table.studyKitId, table.userId),
  ],
);

export type StudyKit = typeof studyKits.$inferSelect;
export type NewStudyKit = typeof studyKits.$inferInsert;

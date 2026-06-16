import { index, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

import { users } from "./users.js";
import { academicTerms } from "./academic_terms.js";

export const scheduleImports = pgTable(
  "schedule_imports",
  {
    id: uuid("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    sourceType: text("source_type").notNull(),
    sourceFingerprint: text("source_fingerprint").notNull(),
    sourceName: text("source_name").notNull(),
    sourcePath: text("source_path"),
    sourceDeletedAt: timestamp("source_deleted_at", { withTimezone: true }),
    extractedTextDeletedAt: timestamp("extracted_text_deleted_at", { withTimezone: true }),
    timezone: text("timezone").notNull(),
    rawOcrTextPreview: text("raw_ocr_text_preview"),
    parserVersion: text("parser_version"),
    termId: uuid("term_id").references(() => academicTerms.id, { onDelete: "set null" }),
    proposal: jsonb("proposal").notNull(),
    aiProposal: jsonb("ai_proposal"),
    approvedEntryIds: jsonb("approved_entry_ids").notNull().default([]),
    status: text("status").notNull(),
    error: text("error"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("schedule_imports_user_source_fingerprint_unique").on(
      table.userId,
      table.sourceFingerprint,
    ),
    index("schedule_imports_user_updated_at_idx").on(table.userId, table.updatedAt),
  ],
);

export type ScheduleImport = typeof scheduleImports.$inferSelect;
export type NewScheduleImport = typeof scheduleImports.$inferInsert;

import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { recurrenceSeries } from "./recurrence_series.js";
import { users } from "./users.js";

export const recurrenceOccurrences = pgTable("recurrence_occurrences", {
  id: uuid("id").primaryKey(),
  seriesId: uuid("series_id")
    .notNull()
    .references(() => recurrenceSeries.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  entityType: text("entity_type").notNull(),
  entityId: uuid("entity_id").notNull(),
  originalStartAt: timestamp("original_start_at", { withTimezone: true }).notNull(),
  effectiveStartAt: timestamp("effective_start_at", { withTimezone: true }).notNull(),
  effectiveEndAt: timestamp("effective_end_at", { withTimezone: true }).notNull(),
  sourceRevision: integer("source_revision").notNull().default(1),
  isCancelled: boolean("is_cancelled").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export type RecurrenceOccurrenceRow = typeof recurrenceOccurrences.$inferSelect;
export type NewRecurrenceOccurrenceRow = typeof recurrenceOccurrences.$inferInsert;

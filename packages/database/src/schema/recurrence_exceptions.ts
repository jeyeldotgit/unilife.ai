import { jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { recurrenceSeries } from "./recurrence_series.js";
import { users } from "./users.js";

export const recurrenceExceptions = pgTable("recurrence_exceptions", {
  id: uuid("id").primaryKey(),
  seriesId: uuid("series_id")
    .notNull()
    .references(() => recurrenceSeries.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  entityType: text("entity_type").notNull(),
  originalStartAt: timestamp("original_start_at", { withTimezone: true }).notNull(),
  exceptionType: text("exception_type").notNull(),
  overrideStartAt: timestamp("override_start_at", { withTimezone: true }),
  overrideEndAt: timestamp("override_end_at", { withTimezone: true }),
  overridePayload: jsonb("override_payload"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export type RecurrenceExceptionRow = typeof recurrenceExceptions.$inferSelect;
export type NewRecurrenceExceptionRow = typeof recurrenceExceptions.$inferInsert;

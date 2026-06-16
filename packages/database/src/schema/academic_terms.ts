import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { users } from "./users.js";

export const academicTerms = pgTable(
  "academic_terms",
  {
    id: uuid("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    status: text("status").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("academic_terms_user_status_idx").on(table.userId, table.status),
    index("academic_terms_user_updated_at_idx").on(table.userId, table.updatedAt),
  ],
);

export type AcademicTermRow = typeof academicTerms.$inferSelect;
export type NewAcademicTermRow = typeof academicTerms.$inferInsert;

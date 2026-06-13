import { jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { users } from "./users.js";

export const aiActionHistory = pgTable("ai_action_history", {
  id: uuid("id").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  proposal: jsonb("proposal").notNull(),
  status: text("status").notNull(),
  processingLayer: text("processing_layer").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type AiActionHistory = typeof aiActionHistory.$inferSelect;
export type NewAiActionHistory = typeof aiActionHistory.$inferInsert;

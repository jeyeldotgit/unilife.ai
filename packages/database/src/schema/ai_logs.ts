import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  numeric,
} from "drizzle-orm/pg-core";
import { users } from "./users.js";

export const aiLogs = pgTable("ai_logs", {
  id: uuid("id").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  rawInput: text("raw_input").notNull(),
  detectedIntent: text("detected_intent"),
  confidence: numeric("confidence", { precision: 4, scale: 3 }),
  processingLayer: text("processing_layer").notNull(),
  structuredOutput: jsonb("structured_output"),
  error: text("error"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type AiLog = typeof aiLogs.$inferSelect;
export type NewAiLog = typeof aiLogs.$inferInsert;

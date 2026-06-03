import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  smallint,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const syncQueue = pgTable("sync_queue", {
  id: uuid("id").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  entityType: text("entity_type").notNull(),
  entityId: uuid("entity_id").notNull(),
  operation: text("operation").notNull(),
  payload: jsonb("payload").notNull(),
  status: text("status").notNull().default("pending"),
  retryCount: smallint("retry_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  lastAttemptedAt: timestamp("last_attempted_at", { withTimezone: true }),
});

export type SyncQueue = typeof syncQueue.$inferSelect;
export type NewSyncQueue = typeof syncQueue.$inferInsert;

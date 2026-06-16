import {
  pgTable,
  uuid,
  text,
  timestamp,
  numeric,
  date,
  boolean,
} from "drizzle-orm/pg-core";
import { users } from "./users.js";

export const budgets = pgTable("budgets", {
  id: uuid("id").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  period: text("period").notNull(),
  isRolling: boolean("is_rolling").notNull().default(false),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Budget = typeof budgets.$inferSelect;
export type NewBudget = typeof budgets.$inferInsert;

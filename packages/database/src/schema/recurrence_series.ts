import {
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { users } from "./users.js";

export const recurrenceSeries = pgTable("recurrence_series", {
  id: uuid("id").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  entityType: text("entity_type").notNull(),
  frequency: text("frequency").notNull(),
  interval: integer("interval").notNull().default(1),
  weekdays: text("weekdays").array().notNull(),
  timezone: text("timezone").notNull(),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true }),
  revision: integer("revision").notNull().default(1),
  expenseTemplate: jsonb("expense_template"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export type RecurrenceSeriesRow = typeof recurrenceSeries.$inferSelect;
export type NewRecurrenceSeriesRow = typeof recurrenceSeries.$inferInsert;

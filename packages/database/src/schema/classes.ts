import {
  pgTable,
  uuid,
  text,
  timestamp,
  time,
  boolean,
  jsonb,
} from "drizzle-orm/pg-core";
import { users } from "./users.js";
import { academicTerms } from "./academic_terms.js";

export const classes = pgTable("classes", {
  id: uuid("id").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  termId: uuid("term_id").references(() => academicTerms.id, { onDelete: "set null" }),
  subject: text("subject").notNull(),
  room: text("room"),
  instructor: text("instructor"),
  dayOfWeek: text("day_of_week").notNull(),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  color: text("color"),
  isActive: boolean("is_active").notNull().default(true),
  recurrence: jsonb("recurrence"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export type Class = typeof classes.$inferSelect;
export type NewClass = typeof classes.$inferInsert;

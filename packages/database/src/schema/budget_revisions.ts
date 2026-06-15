import { jsonb, pgTable, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

import { budgets } from "./budgets.js";
import { users } from "./users.js";

export const budgetRevisions = pgTable(
  "budget_revisions",
  {
    id: uuid("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    budgetId: uuid("budget_id")
      .notNull()
      .references(() => budgets.id, { onDelete: "cascade" }),
    prior: jsonb("prior").notNull(),
    resulting: jsonb("resulting").notNull(),
    changedAt: timestamp("changed_at", { withTimezone: true }).notNull().defaultNow(),
    mutationId: uuid("mutation_id").notNull(),
  },
  (table) => [
    uniqueIndex("budget_revisions_user_budget_mutation_unique").on(
      table.userId,
      table.budgetId,
      table.mutationId,
    ),
  ],
);

export type BudgetRevisionRow = typeof budgetRevisions.$inferSelect;
export type NewBudgetRevisionRow = typeof budgetRevisions.$inferInsert;

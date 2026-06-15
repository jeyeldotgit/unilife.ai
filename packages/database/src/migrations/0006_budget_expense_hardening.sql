ALTER TABLE "expenses" ADD COLUMN "refund_of_expense_id" uuid;
ALTER TABLE "expenses" ADD COLUMN "recurrence" jsonb;
ALTER TABLE "recurrence_series" ADD COLUMN "expense_template" jsonb;

CREATE TABLE "budget_revisions" (
  "id" uuid PRIMARY KEY NOT NULL,
  "user_id" uuid NOT NULL,
  "budget_id" uuid NOT NULL,
  "prior" jsonb NOT NULL,
  "resulting" jsonb NOT NULL,
  "changed_at" timestamp with time zone DEFAULT now() NOT NULL,
  "mutation_id" uuid NOT NULL
);

ALTER TABLE "budget_revisions" ADD CONSTRAINT "budget_revisions_user_id_users_id_fk"
FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "budget_revisions" ADD CONSTRAINT "budget_revisions_budget_id_budgets_id_fk"
FOREIGN KEY ("budget_id") REFERENCES "public"."budgets"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_refund_of_expense_id_expenses_id_fk"
FOREIGN KEY ("refund_of_expense_id") REFERENCES "public"."expenses"("id") ON DELETE restrict ON UPDATE no action;

CREATE UNIQUE INDEX "budget_revisions_user_budget_mutation_unique"
ON "budget_revisions" USING btree ("user_id", "budget_id", "mutation_id");
CREATE INDEX "budget_revisions_user_budget_changed_idx"
ON "budget_revisions" USING btree ("user_id", "budget_id", "changed_at");
CREATE INDEX "expenses_refund_of_expense_id_idx"
ON "expenses" USING btree ("refund_of_expense_id");
CREATE UNIQUE INDEX "recurrence_occurrences_series_original_unique"
ON "recurrence_occurrences" USING btree ("series_id", "original_start_at");

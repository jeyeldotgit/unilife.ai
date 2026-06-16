export type BudgetPeriod = "daily" | "weekly" | "biweekly" | "monthly";

export type Budget = {
  id: string;
  user_id: string;
  amount: number; // total allowance
  period: BudgetPeriod;
  is_rolling?: boolean;
  start_date: string; // ISO 8601 date
  end_date: string; // ISO 8601 date
  created_at: string;
  updated_at: string;
};

export type BudgetRevisionSnapshot = Pick<
  Budget,
  "amount" | "period" | "start_date" | "end_date"
>;

export type BudgetRevision = {
  id: string;
  user_id: string;
  budget_id: string;
  prior: BudgetRevisionSnapshot;
  resulting: BudgetRevisionSnapshot;
  changed_at: string;
  mutation_id: string;
};

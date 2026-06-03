export type BudgetPeriod = "weekly" | "biweekly" | "monthly";

export type Budget = {
  id: string;
  user_id: string;
  amount: number; // total allowance
  period: BudgetPeriod;
  start_date: string; // ISO 8601 date
  end_date: string; // ISO 8601 date
  created_at: string;
  updated_at: string;
};

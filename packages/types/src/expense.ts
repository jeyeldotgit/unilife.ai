export type ExpenseCategory =
  | "food"
  | "transportation"
  | "school"
  | "entertainment"
  | "miscellaneous";

export type Expense = {
  id: string;
  user_id: string;
  budget_id: string | null;
  amount: number; // in PHP, stored as float
  category: ExpenseCategory;
  description: string | null;
  spent_at: string; // ISO 8601
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Expense, ExpenseCategory } from "@unilife-ai/types";

import { ExpensesRepository } from "../repositories/expenses.repository.js";

export type ListExpensesFilters = {
  since?: string;
  from?: string;
  to?: string;
  category?: ExpenseCategory;
};

export type CreateExpenseInput = {
  id: string;
  budget_id?: string | null;
  amount: number;
  category: ExpenseCategory;
  description?: string;
  spent_at?: string;
  created_at: string;
  updated_at: string;
};

type ExpenseDeleteResult =
  | { status: "deleted" }
  | { status: "missing" }
  | { status: "foreign" };

function calculateTotal(expenses: Expense[]) {
  return expenses.reduce((total, expense) => total + expense.amount, 0);
}

export class ExpensesService {
  private readonly repository: ExpensesRepository;

  constructor(
    supabase: SupabaseClient,
    private readonly userId: string,
    repository = new ExpensesRepository(supabase),
  ) {
    this.repository = repository;
  }

  async listForUser(filters: ListExpensesFilters) {
    const expenses = await this.repository.listForUser(this.userId, filters);

    return {
      expenses,
      total: calculateTotal(expenses),
    };
  }

  async createExpense(input: CreateExpenseInput) {
    const record: Expense = {
      id: input.id,
      user_id: this.userId,
      budget_id: input.budget_id ?? null,
      amount: input.amount,
      category: input.category,
      description: input.description ?? null,
      spent_at: input.spent_at ?? new Date().toISOString(),
      created_at: input.created_at,
      updated_at: input.updated_at,
      deleted_at: null,
    };

    return this.repository.create(record);
  }

  async deleteExpense(id: string): Promise<ExpenseDeleteResult> {
    const existingRecord = await this.repository.findByIdForUser(id, this.userId);

    if (!existingRecord) {
      if (await this.repository.existsForOtherUser(id, this.userId)) {
        return { status: "foreign" };
      }

      return { status: "missing" };
    }

    const deleted = await this.repository.softDeleteForUser(
      id,
      this.userId,
      new Date().toISOString(),
    );

    if (!deleted) {
      return { status: "missing" };
    }

    return { status: "deleted" };
  }
}

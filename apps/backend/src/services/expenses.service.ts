import type { SupabaseClient } from "@supabase/supabase-js";
import type { Expense, ExpenseCategory, RecurrenceEditScope, RecurrenceReference } from "@unilife-ai/types";

import { ExpensesRepository } from "../repositories/expenses.repository.js";
import { conflict, forbidden, notFound } from "../lib/http-errors.js";

export type ListExpensesFilters = {
  since?: string;
  from?: string;
  to?: string;
  from_at?: string;
  to_at?: string;
  category?: ExpenseCategory;
};

export type CreateExpenseInput = {
  id: string;
  budget_id?: string | null;
  refund_of_expense_id?: string | null;
  amount: number;
  category: ExpenseCategory;
  description?: string;
  spent_at?: string;
  recurrence?: Record<string, unknown> | RecurrenceReference | null;
  created_at: string;
  updated_at: string;
};

export type UpdateExpenseInput = {
  amount?: number;
  category?: ExpenseCategory;
  description?: string | null;
  spent_at?: string;
  recurrence?: Record<string, unknown> | RecurrenceReference | null;
  edit_scope?: RecurrenceEditScope;
  updated_at: string;
};

type ExpenseDeleteResult =
  | { status: "deleted" }
  | { status: "missing" }
  | { status: "foreign" }
  | { status: "has_refunds" };

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
    let budgetId = input.budget_id ?? null;
    let category = input.category;
    const refundOfExpenseId = input.refund_of_expense_id ?? null;

    if (input.amount < 0) {
      if (!refundOfExpenseId) throw conflict("Negative expenses must be linked to an original expense.");
      const original = await this.repository.findByIdForUser(refundOfExpenseId, this.userId);
      if (!original) {
        if (await this.repository.existsForOtherUser(refundOfExpenseId, this.userId)) throw forbidden();
        throw notFound("Original expense not found.");
      }
      if (original.amount <= 0 || original.refund_of_expense_id) throw conflict("Refunds cannot reference another refund.");
      const refunded = await this.repository.getActiveRefundTotal(this.userId, original.id);
      if (Math.abs(input.amount) > original.amount + refunded) throw conflict("Refund exceeds the remaining refundable amount.");
      budgetId = original.budget_id;
      category = original.category;
    } else if (refundOfExpenseId) {
      throw conflict("Positive expenses cannot reference an original expense.");
    }

    const record: Expense = {
      id: input.id,
      user_id: this.userId,
      budget_id: budgetId,
      refund_of_expense_id: refundOfExpenseId,
      amount: input.amount,
      category,
      description: input.description ?? null,
      spent_at: input.spent_at ?? new Date().toISOString(),
      recurrence: (input.recurrence as RecurrenceReference | null | undefined) ?? null,
      created_at: input.created_at,
      updated_at: input.updated_at,
      deleted_at: null,
    };

    return this.repository.create(record);
  }

  async updateExpense(id: string, input: UpdateExpenseInput) {
    const existing = await this.repository.findByIdForUser(id, this.userId);
    if (!existing) {
      if (await this.repository.existsForOtherUser(id, this.userId)) return { status: "foreign" as const };
      return { status: "missing" as const };
    }
    if (existing.refund_of_expense_id) return { status: "refund" as const };
    const changes: Partial<Expense> = { updated_at: input.updated_at };
    if (input.amount !== undefined) changes.amount = input.amount;
    if (input.category !== undefined) changes.category = input.category;
    if (input.description !== undefined) changes.description = input.description;
    if (input.spent_at !== undefined) changes.spent_at = input.spent_at;
    if (input.recurrence !== undefined) changes.recurrence = input.recurrence as RecurrenceReference | null;
    const record = await this.repository.updateForUser(id, this.userId, changes);
    return record ? { status: "updated" as const, record } : { status: "missing" as const };
  }

  async deleteExpense(id: string, _editScope?: RecurrenceEditScope): Promise<ExpenseDeleteResult> {
    const existingRecord = await this.repository.findByIdForUser(id, this.userId);

    if (!existingRecord) {
      if (await this.repository.existsForOtherUser(id, this.userId)) {
        return { status: "foreign" };
      }

      return { status: "missing" };
    }

    if (existingRecord.amount > 0 && (await this.repository.hasActiveRefunds(this.userId, id))) {
      return { status: "has_refunds" };
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

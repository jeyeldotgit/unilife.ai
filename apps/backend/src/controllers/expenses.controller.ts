import type { SupabaseClient } from "@supabase/supabase-js";

import { conflict, forbidden, notFound } from "../lib/http-errors.js";
import type {
  CreateExpenseInput,
  ListExpensesFilters,
  UpdateExpenseInput,
} from "../services/expenses.service.js";
import { ExpensesService } from "../services/expenses.service.js";

export class ExpensesController {
  private readonly service: ExpensesService;

  constructor(supabase: SupabaseClient, userId: string) {
    this.service = new ExpensesService(supabase, userId);
  }

  async list(filters: ListExpensesFilters) {
    return this.service.listForUser(filters);
  }

  async create(input: CreateExpenseInput) {
    const expense = await this.service.createExpense(input);

    return { expense };
  }

  async update(id: string, input: UpdateExpenseInput) {
    const result = await this.service.updateExpense(id, input);
    if (result.status === "foreign") throw forbidden("Expense does not belong to the authenticated user.");
    if (result.status === "missing") throw notFound("Expense not found.");
    if (result.status === "refund") throw conflict("Refund records cannot be edited.");
    return { expense: result.record };
  }

  async delete(id: string, editScope?: "occurrence" | "future" | "series") {
    const result = await this.service.deleteExpense(id, editScope);

    if (result.status === "foreign") {
      throw forbidden("Expense does not belong to the authenticated user.");
    }

    if (result.status === "missing") {
      throw notFound("Expense not found.");
    }
    if (result.status === "has_refunds") {
      throw conflict("Delete linked refunds before deleting the original expense.");
    }

    return { ok: true };
  }
}

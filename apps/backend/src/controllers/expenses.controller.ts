import type { SupabaseClient } from "@supabase/supabase-js";

import { forbidden, notFound } from "../lib/http-errors.js";
import type {
  CreateExpenseInput,
  ListExpensesFilters,
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

  async delete(id: string) {
    const result = await this.service.deleteExpense(id);

    if (result.status === "foreign") {
      throw forbidden("Expense does not belong to the authenticated user.");
    }

    if (result.status === "missing") {
      throw notFound("Expense not found.");
    }

    return { ok: true };
  }
}

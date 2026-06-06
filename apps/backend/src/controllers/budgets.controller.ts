import type { SupabaseClient } from "@supabase/supabase-js";

import { forbidden, notFound } from "../lib/http-errors.js";
import type {
  CreateBudgetInput,
  ListBudgetsFilters,
  UpdateBudgetInput,
} from "../services/budgets.service.js";
import { BudgetsService } from "../services/budgets.service.js";

export class BudgetsController {
  private readonly service: BudgetsService;

  constructor(supabase: SupabaseClient, userId: string) {
    this.service = new BudgetsService(supabase, userId);
  }

  async list(filters: ListBudgetsFilters) {
    const budgets = await this.service.listForUser(filters);

    return { budgets };
  }

  async create(input: CreateBudgetInput) {
    const budget = await this.service.createBudget(input);

    return { budget };
  }

  async update(id: string, input: UpdateBudgetInput) {
    const result = await this.service.updateBudget(id, input);

    if (result.status === "foreign") {
      throw forbidden("Budget does not belong to the authenticated user.");
    }

    if (result.status === "missing") {
      throw notFound("Budget not found.");
    }

    return {
      budget: result.status === "updated" ? result.record : null,
    };
  }
}

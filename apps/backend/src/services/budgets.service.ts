import type { SupabaseClient } from "@supabase/supabase-js";
import type { Budget, BudgetPeriod } from "@unilife-ai/types";

import { BudgetsRepository } from "../repositories/budgets.repository.js";

export type ListBudgetsFilters = {
  since?: string;
};

export type CreateBudgetInput = {
  id: string;
  amount: number;
  period: BudgetPeriod;
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
};

export type UpdateBudgetInput = {
  amount?: number;
  period?: BudgetPeriod;
  end_date?: string;
  updated_at: string;
};

type BudgetUpdateResult =
  | { status: "updated"; record: Budget }
  | { status: "stale" }
  | { status: "missing" }
  | { status: "foreign" };

function isOlderTimestamp(incomingUpdatedAt: string, currentUpdatedAt: string) {
  return Date.parse(incomingUpdatedAt) < Date.parse(currentUpdatedAt);
}

export class BudgetsService {
  private readonly repository: BudgetsRepository;

  constructor(
    supabase: SupabaseClient,
    private readonly userId: string,
    repository = new BudgetsRepository(supabase),
  ) {
    this.repository = repository;
  }

  async listForUser(filters: ListBudgetsFilters) {
    return this.repository.listForUser(this.userId, filters);
  }

  async createBudget(input: CreateBudgetInput) {
    const record: Budget = {
      id: input.id,
      user_id: this.userId,
      amount: input.amount,
      period: input.period,
      start_date: input.start_date,
      end_date: input.end_date,
      created_at: input.created_at,
      updated_at: input.updated_at,
    };

    return this.repository.create(record);
  }

  async updateBudget(id: string, input: UpdateBudgetInput): Promise<BudgetUpdateResult> {
    const existingRecord = await this.repository.findByIdForUser(id, this.userId);

    if (!existingRecord) {
      if (await this.repository.existsForOtherUser(id, this.userId)) {
        return { status: "foreign" };
      }

      return { status: "missing" };
    }

    if (isOlderTimestamp(input.updated_at, existingRecord.updated_at)) {
      return { status: "stale" };
    }

    const changes: Partial<Budget> = {
      updated_at: input.updated_at,
    };

    if (input.amount !== undefined) {
      changes.amount = input.amount;
    }

    if (input.period !== undefined) {
      changes.period = input.period;
    }

    if (input.end_date !== undefined) {
      changes.end_date = input.end_date;
    }

    const updatedRecord = await this.repository.updateForUser(id, this.userId, changes);

    if (!updatedRecord) {
      return { status: "missing" };
    }

    return {
      status: "updated",
      record: updatedRecord,
    };
  }
}

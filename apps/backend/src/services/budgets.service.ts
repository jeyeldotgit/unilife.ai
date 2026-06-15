import type { SupabaseClient } from "@supabase/supabase-js";
import type { Budget, BudgetPeriod, BudgetRevision, BudgetRevisionSnapshot } from "@unilife-ai/types";

import { BudgetsRepository } from "../repositories/budgets.repository.js";
import { BudgetRevisionsRepository } from "../repositories/budget-revisions.repository.js";

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
  start_date?: string;
  end_date?: string;
  updated_at: string;
  mutation_id: string;
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
    private readonly revisionsRepository = new BudgetRevisionsRepository(supabase),
  ) {
    this.repository = repository;
  }

  async listRevisions(id: string) {
    const budget = await this.repository.findByIdForUser(id, this.userId);
    if (!budget) {
      if (await this.repository.existsForOtherUser(id, this.userId)) return { status: "foreign" as const };
      return { status: "missing" as const };
    }
    return {
      status: "found" as const,
      records: await this.revisionsRepository.listForBudget(this.userId, id),
    };
  }

  async listAllRevisions(since?: string) {
    return this.revisionsRepository.listForUser(this.userId, since);
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

    const existingRevision = await this.revisionsRepository.findByMutation(
      this.userId,
      id,
      input.mutation_id,
    );
    if (existingRevision) {
      return { status: "updated", record: existingRecord };
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

    if (input.start_date !== undefined) {
      changes.start_date = input.start_date;
    }

    if (input.end_date !== undefined) {
      changes.end_date = input.end_date;
    }

    const updatedRecord = await this.repository.updateForUser(id, this.userId, changes);

    if (!updatedRecord) {
      return { status: "missing" };
    }

    const snapshot = (budget: Budget): BudgetRevisionSnapshot => ({
      amount: budget.amount,
      period: budget.period,
      start_date: budget.start_date,
      end_date: budget.end_date,
    });
    const changed =
      existingRecord.amount !== updatedRecord.amount ||
      existingRecord.period !== updatedRecord.period ||
      existingRecord.start_date !== updatedRecord.start_date ||
      existingRecord.end_date !== updatedRecord.end_date;

    if (changed) {
      const revision: BudgetRevision = {
        id: crypto.randomUUID(),
        user_id: this.userId,
        budget_id: id,
        prior: snapshot(existingRecord),
        resulting: snapshot(updatedRecord),
        changed_at: input.updated_at,
        mutation_id: input.mutation_id,
      };
      await this.revisionsRepository.create(revision);
    }

    return {
      status: "updated",
      record: updatedRecord,
    };
  }
}

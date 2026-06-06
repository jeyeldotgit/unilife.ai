import type { SupabaseClient } from "@supabase/supabase-js";
import type { Budget } from "@unilife-ai/types";

type DatabaseBudgetRow = Omit<Budget, "amount"> & {
  amount: number | string;
};

function isNotFoundError(error: { code?: string } | null) {
  return error?.code === "PGRST116";
}

function toBudget(record: DatabaseBudgetRow): Budget {
  return {
    ...record,
    amount: Number(record.amount),
  };
}

export class BudgetsRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async listForUser(userId: string, filters: { since?: string }) {
    let query = this.supabase
      .from("budgets")
      .select("*")
      .eq("user_id", userId)
      .order("start_date", { ascending: false });

    if (filters.since) {
      query = query.gt("updated_at", filters.since);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map((record) => toBudget(record as DatabaseBudgetRow));
  }

  async findByIdForUser(id: string, userId: string) {
    const { data, error } = await this.supabase
      .from("budgets")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (error) {
      if (isNotFoundError(error)) {
        return null;
      }

      throw new Error(error.message);
    }

    return toBudget(data as DatabaseBudgetRow);
  }

  async existsForOtherUser(id: string, userId: string) {
    const { data, error } = await this.supabase
      .from("budgets")
      .select("id")
      .eq("id", id)
      .neq("user_id", userId)
      .single();

    if (error) {
      if (isNotFoundError(error)) {
        return false;
      }

      throw new Error(error.message);
    }

    return Boolean(data);
  }

  async create(record: Budget) {
    const { data, error } = await this.supabase
      .from("budgets")
      .insert(record)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return toBudget(data as DatabaseBudgetRow);
  }

  async updateForUser(id: string, userId: string, changes: Partial<Budget>) {
    const { data, error } = await this.supabase
      .from("budgets")
      .update(changes)
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      if (isNotFoundError(error)) {
        return null;
      }

      throw new Error(error.message);
    }

    return toBudget(data as DatabaseBudgetRow);
  }
}

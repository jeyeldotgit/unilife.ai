import type { SupabaseClient } from "@supabase/supabase-js";
import type { BudgetRevision } from "@unilife-ai/types";

function isNotFoundError(error: { code?: string } | null) {
  return error?.code === "PGRST116";
}

export class BudgetRevisionsRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async listForBudget(userId: string, budgetId: string) {
    const { data, error } = await this.supabase
      .from("budget_revisions")
      .select("*")
      .eq("user_id", userId)
      .eq("budget_id", budgetId)
      .order("changed_at", { ascending: false });

    if (error) throw new Error(error.message);
    return (data ?? []) as BudgetRevision[];
  }

  async listForUser(userId: string, since?: string) {
    let query = this.supabase
      .from("budget_revisions")
      .select("*")
      .eq("user_id", userId)
      .order("changed_at", { ascending: false });
    if (since) query = query.gt("changed_at", since);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data ?? []) as BudgetRevision[];
  }

  async findByMutation(userId: string, budgetId: string, mutationId: string) {
    const { data, error } = await this.supabase
      .from("budget_revisions")
      .select("*")
      .eq("user_id", userId)
      .eq("budget_id", budgetId)
      .eq("mutation_id", mutationId)
      .single();

    if (error) {
      if (isNotFoundError(error)) return null;
      throw new Error(error.message);
    }
    return data as BudgetRevision;
  }

  async create(record: BudgetRevision) {
    const { data, error } = await this.supabase
      .from("budget_revisions")
      .insert(record)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as BudgetRevision;
  }
}

import type { SupabaseClient } from "@supabase/supabase-js";
import type { AiActionHistory } from "@unilife-ai/types";

export class AIActionsRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async listForUser(userId: string, filters: { since?: string } = {}) {
    let query = this.supabase
      .from("ai_action_history")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (filters.since) {
      query = query.gt("updated_at", filters.since);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data ?? []) as AiActionHistory[];
  }

  async upsert(record: AiActionHistory) {
    const { error } = await this.supabase.from("ai_action_history").upsert(record);
    if (error) throw new Error(error.message);
  }
}

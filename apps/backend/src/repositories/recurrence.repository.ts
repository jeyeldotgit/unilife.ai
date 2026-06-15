import type { SupabaseClient } from "@supabase/supabase-js";

export type RecurrenceSyncEntity =
  | "recurrence_series"
  | "recurrence_occurrence"
  | "recurrence_exception";

export class RecurrenceRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  private table(entity: RecurrenceSyncEntity) {
    return entity === "recurrence_series"
      ? "recurrence_series"
      : entity === "recurrence_occurrence"
        ? "recurrence_occurrences"
        : "recurrence_exceptions";
  }

  async listForUser(entity: RecurrenceSyncEntity, userId: string, since?: string) {
    let query = this.supabase.from(this.table(entity)).select("*").eq("user_id", userId);
    if (since) query = query.gt("updated_at", since);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data ?? [];
  }

  async upsertForUser(
    entity: RecurrenceSyncEntity,
    userId: string,
    entityId: string,
    payload: Record<string, unknown>,
  ) {
    const { error } = await this.supabase.from(this.table(entity)).upsert({
      ...payload,
      id: entityId,
      user_id: userId,
    });
    if (error) throw new Error(error.message);
    return true;
  }
}

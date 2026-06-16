import type { SupabaseClient } from "@supabase/supabase-js";
import type { AcademicTerm } from "@unilife-ai/types";

function isNotFoundError(error: { code?: string } | null) {
  return error?.code === "PGRST116";
}

export class AcademicTermsRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async listForUser(userId: string, filters: { since?: string } = {}) {
    let query = this.supabase
      .from("academic_terms")
      .select("*")
      .eq("user_id", userId)
      .is("deleted_at", null)
      .order("updated_at", { ascending: false });

    if (filters.since) query = query.gt("updated_at", filters.since);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data ?? []) as AcademicTerm[];
  }

  async findByIdForUser(id: string, userId: string) {
    const { data, error } = await this.supabase
      .from("academic_terms")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .is("deleted_at", null)
      .single();

    if (error) {
      if (isNotFoundError(error)) return null;
      throw new Error(error.message);
    }

    return data as AcademicTerm;
  }

  async findActiveForUser(userId: string) {
    const { data, error } = await this.supabase
      .from("academic_terms")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active")
      .is("deleted_at", null)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return (data ?? null) as AcademicTerm | null;
  }

  async upsert(record: AcademicTerm) {
    const { error } = await this.supabase.from("academic_terms").upsert(record);
    if (error) throw new Error(error.message);
  }
}

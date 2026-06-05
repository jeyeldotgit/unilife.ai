import type { SupabaseClient } from "@supabase/supabase-js";
import type { Exam } from "@unilife-ai/types";

function isNotFoundError(error: { code?: string } | null) {
  return error?.code === "PGRST116";
}

export class ExamsRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async listForUser(userId: string, filters: { since?: string }) {
    let query = this.supabase
      .from("exams")
      .select("*")
      .eq("user_id", userId)
      .is("deleted_at", null);

    if (filters.since) {
      query = query.gt("updated_at", filters.since);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []) as Exam[];
  }

  async findByIdForUser(id: string, userId: string) {
    const { data, error } = await this.supabase
      .from("exams")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .is("deleted_at", null)
      .single();

    if (error) {
      if (isNotFoundError(error)) {
        return null;
      }

      throw new Error(error.message);
    }

    return data as Exam;
  }

  async existsForOtherUser(id: string, userId: string) {
    const { data, error } = await this.supabase
      .from("exams")
      .select("id")
      .eq("id", id)
      .neq("user_id", userId)
      .is("deleted_at", null)
      .single();

    if (error) {
      if (isNotFoundError(error)) {
        return false;
      }

      throw new Error(error.message);
    }

    return Boolean(data);
  }

  async create(record: Exam) {
    const { data, error } = await this.supabase.from("exams").insert(record).select().single();

    if (error) {
      throw new Error(error.message);
    }

    return data as Exam;
  }

  async updateForUser(id: string, userId: string, changes: Partial<Exam>) {
    const { data, error } = await this.supabase
      .from("exams")
      .update(changes)
      .eq("id", id)
      .eq("user_id", userId)
      .is("deleted_at", null)
      .select()
      .single();

    if (error) {
      if (isNotFoundError(error)) {
        return null;
      }

      throw new Error(error.message);
    }

    return data as Exam;
  }

  async softDeleteForUser(id: string, userId: string, deletedAt: string) {
    const { data, error } = await this.supabase
      .from("exams")
      .update({ deleted_at: deletedAt })
      .eq("id", id)
      .eq("user_id", userId)
      .is("deleted_at", null)
      .select("id")
      .single();

    if (error) {
      if (isNotFoundError(error)) {
        return false;
      }

      throw new Error(error.message);
    }

    return Boolean(data);
  }
}

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Assignment, AssignmentStatus } from "@unilife-ai/types";

function isNotFoundError(error: { code?: string } | null) {
  return error?.code === "PGRST116";
}

export class AssignmentsRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async listForUser(
    userId: string,
    filters: { since?: string; status?: AssignmentStatus },
  ) {
    let query = this.supabase
      .from("assignments")
      .select("*")
      .eq("user_id", userId)
      .is("deleted_at", null);

    if (filters.since) {
      query = query.gt("updated_at", filters.since);
    }

    if (filters.status) {
      query = query.eq("status", filters.status);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []) as Assignment[];
  }

  async findByIdForUser(id: string, userId: string) {
    const { data, error } = await this.supabase
      .from("assignments")
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

    return data as Assignment;
  }

  async existsForOtherUser(id: string, userId: string) {
    const { data, error } = await this.supabase
      .from("assignments")
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

  async create(record: Assignment) {
    const { data, error } = await this.supabase
      .from("assignments")
      .insert(record)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data as Assignment;
  }

  async updateForUser(id: string, userId: string, changes: Partial<Assignment>) {
    const { data, error } = await this.supabase
      .from("assignments")
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

    return data as Assignment;
  }

  async softDeleteForUser(id: string, userId: string, deletedAt: string) {
    const { data, error } = await this.supabase
      .from("assignments")
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

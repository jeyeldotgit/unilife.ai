import type { SupabaseClient } from "@supabase/supabase-js";
import type { ClassRecord } from "@unilife-ai/types";

function isNotFoundError(error: { code?: string } | null) {
  return error?.code === "PGRST116";
}

export class ClassesRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async listForUser(userId: string, filters: { since?: string }) {
    let query = this.supabase
      .from("classes")
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

    return (data ?? []) as ClassRecord[];
  }

  async findByIdForUser(id: string, userId: string) {
    const { data, error } = await this.supabase
      .from("classes")
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

    return data as ClassRecord;
  }

  async findByIdIncludingDeletedForUser(id: string, userId: string) {
    const { data, error } = await this.supabase
      .from("classes")
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

    return data as ClassRecord;
  }

  async existsForOtherUser(id: string, userId: string) {
    const { data, error } = await this.supabase
      .from("classes")
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

  async existsForOtherUserIncludingDeleted(id: string, userId: string) {
    const { data, error } = await this.supabase
      .from("classes")
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

  async create(record: ClassRecord) {
    const { data, error } = await this.supabase
      .from("classes")
      .insert(record)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data as ClassRecord;
  }

  async upsert(record: ClassRecord) {
    const { data, error } = await this.supabase
      .from("classes")
      .upsert(record)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data as ClassRecord;
  }

  async updateForUser(id: string, userId: string, changes: Partial<ClassRecord>) {
    const { data, error } = await this.supabase
      .from("classes")
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

    return data as ClassRecord;
  }

  async softDeleteForUser(id: string, userId: string, deletedAt: string) {
    const { data, error } = await this.supabase
      .from("classes")
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

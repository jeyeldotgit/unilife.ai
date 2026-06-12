import type { SupabaseClient } from "@supabase/supabase-js";
import type { UserProfile } from "@unilife-ai/types";

function isNotFoundError(error: { code?: string } | null) {
  return error?.code === "PGRST116";
}

export class ProfileRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async findById(userId: string) {
    const { data, error } = await this.supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      if (isNotFoundError(error)) {
        return null;
      }

      throw new Error(error.message);
    }

    return data as UserProfile;
  }

  async updateById(userId: string, changes: Partial<UserProfile>) {
    const { data, error } = await this.supabase
      .from("users")
      .update(changes)
      .eq("id", userId)
      .select("*")
      .single();

    if (error) {
      if (isNotFoundError(error)) {
        return null;
      }

      throw new Error(error.message);
    }

    return data as UserProfile;
  }
}

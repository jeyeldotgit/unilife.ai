import type { SupabaseClient } from "@supabase/supabase-js";
import type { NotificationPreference } from "@unilife-ai/types";

export class NotificationPreferencesRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async listForUser(userId: string) {
    const { data, error } = await this.supabase
      .from("notification_preferences")
      .select("*")
      .eq("user_id", userId);

    if (error) throw new Error(error.message);
    return (data ?? []) as Array<NotificationPreference & { user_id: string }>;
  }

  async upsertForUser(userId: string, preferences: NotificationPreference[]) {
    const updatedAt = new Date().toISOString();
    const rows = preferences.map((preference) => ({
      id: crypto.randomUUID(),
      user_id: userId,
      ...preference,
      updated_at: updatedAt,
    }));
    const { data, error } = await this.supabase
      .from("notification_preferences")
      .upsert(rows, { onConflict: "user_id,category" })
      .select("*");

    if (error) throw new Error(error.message);
    return data ?? [];
  }
}

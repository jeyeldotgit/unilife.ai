import type { SupabaseClient } from "@supabase/supabase-js";
import type { ScheduleImportHistory } from "@unilife-ai/types";

export class ScheduleImportsRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async findByIdForUser(id: string, userId: string) {
    const { data, error } = await this.supabase
      .from("schedule_imports")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return (data as ScheduleImportHistory | null) ?? null;
  }

  async findByFingerprintForUser(sourceFingerprint: string, userId: string) {
    const { data, error } = await this.supabase
      .from("schedule_imports")
      .select("*")
      .eq("source_fingerprint", sourceFingerprint)
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return (data as ScheduleImportHistory | null) ?? null;
  }

  async upsert(record: ScheduleImportHistory) {
    const { error } = await this.supabase.from("schedule_imports").upsert(record);
    if (error) throw new Error(error.message);
  }
}

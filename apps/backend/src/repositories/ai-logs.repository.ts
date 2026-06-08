import type { SupabaseClient } from "@supabase/supabase-js";

export type CreateAILogInput = {
  id: string;
  user_id: string;
  raw_input: string;
  detected_intent: string | null;
  confidence: number | null;
  processing_layer: "gemini";
  structured_output: Record<string, unknown> | null;
  error: string | null;
};

export class AILogsRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async create(record: CreateAILogInput) {
    const { error } = await this.supabase.from("ai_logs").insert(record);

    if (error) {
      throw new Error(error.message);
    }
  }
}

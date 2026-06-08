import type { SupabaseClient } from "@supabase/supabase-js";

import type { AIChatInput } from "../services/ai.service.js";
import { AIService } from "../services/ai.service.js";

export class AIController {
  private readonly service: AIService;

  constructor(supabase: SupabaseClient, userId: string) {
    this.service = new AIService(supabase, userId);
  }

  async chat(input: AIChatInput) {
    const result = await this.service.processChat(input);

    try {
      await this.service.logChat(result.log);
    } catch {
      // Logging must never fail the chat response.
    }

    return result.response;
  }
}

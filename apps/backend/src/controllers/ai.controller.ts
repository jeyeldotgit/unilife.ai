import type { SupabaseClient } from "@supabase/supabase-js";
import type { ScheduleInsightContext } from "@unilife-ai/types";

import type { AIChatInput } from "../services/ai.service.js";
import { AIService } from "../services/ai.service.js";
import { AIActionsService } from "../services/ai-actions.service.js";

export class AIController {
  private readonly service: AIService;
  private readonly actionsService: AIActionsService;

  constructor(supabase: SupabaseClient, userId: string) {
    this.service = new AIService(supabase, userId);
    this.actionsService = new AIActionsService(supabase, userId);
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

  async briefing(context: AIChatInput["context"]) {
    return this.service.createBriefing(context);
  }

  async scheduleInsight(context: ScheduleInsightContext) {
    return this.service.createScheduleInsight(context);
  }

  async actions(filters: { since?: string }) {
    return { actions: await this.actionsService.list(filters) };
  }
}

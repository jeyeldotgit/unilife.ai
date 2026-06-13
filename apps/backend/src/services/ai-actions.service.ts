import type { SupabaseClient } from "@supabase/supabase-js";

import { AIActionsRepository } from "../repositories/ai-actions.repository.js";

export class AIActionsService {
  private readonly repository: AIActionsRepository;

  constructor(
    supabase: SupabaseClient,
    private readonly userId: string,
    repository = new AIActionsRepository(supabase),
  ) {
    this.repository = repository;
  }

  list(filters: { since?: string }) {
    return this.repository.listForUser(this.userId, filters);
  }
}

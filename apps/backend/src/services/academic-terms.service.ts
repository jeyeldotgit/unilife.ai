import type { SupabaseClient } from "@supabase/supabase-js";
import type { AcademicTerm } from "@unilife-ai/types";

import { AcademicTermsRepository } from "../repositories/academic-terms.repository.js";

export class AcademicTermsService {
  private readonly repository: AcademicTermsRepository;

  constructor(
    supabase: SupabaseClient,
    private readonly userId: string,
    repository = new AcademicTermsRepository(supabase),
  ) {
    this.repository = repository;
  }

  list(filters: { since?: string }) {
    return this.repository.listForUser(this.userId, filters);
  }

  async upsert(record: Omit<AcademicTerm, "user_id">) {
    const next: AcademicTerm = { ...record, user_id: this.userId };
    await this.repository.upsert(next);
    return next;
  }
}

import type { SupabaseClient } from "@supabase/supabase-js";
import type { AcademicTerm } from "@unilife-ai/types";

import { AcademicTermsService } from "../services/academic-terms.service.js";

export class AcademicTermsController {
  private readonly service: AcademicTermsService;

  constructor(supabase: SupabaseClient, userId: string) {
    this.service = new AcademicTermsService(supabase, userId);
  }

  async list(filters: { since?: string }) {
    return { terms: await this.service.list(filters) };
  }

  async upsert(input: Omit<AcademicTerm, "user_id">) {
    return { term: await this.service.upsert(input) };
  }
}

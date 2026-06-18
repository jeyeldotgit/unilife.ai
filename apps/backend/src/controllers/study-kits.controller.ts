import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  CreateQuizAttemptInput,
  CreateStudyKitInput,
  SaveCardReviewInput,
} from "../services/study-kits.service.js";
import { StudyKitsService } from "../services/study-kits.service.js";

export class StudyKitsController {
  private readonly service: StudyKitsService;

  constructor(supabase: SupabaseClient, userId: string) {
    this.service = new StudyKitsService(supabase, userId);
  }

  async create(input: CreateStudyKitInput) {
    return this.service.create(input);
  }

  async list() {
    return this.service.list();
  }

  async get(id: string) {
    return this.service.get(id);
  }

  async delete(id: string) {
    return this.service.delete(id);
  }

  async createQuizAttempt(id: string, input: CreateQuizAttemptInput) {
    return this.service.createQuizAttempt(id, input);
  }

  async saveCardReview(id: string, input: SaveCardReviewInput) {
    return this.service.saveCardReview(id, input);
  }

  async export(id: string, format: "csv" | "json") {
    return this.service.export(id, format);
  }
}

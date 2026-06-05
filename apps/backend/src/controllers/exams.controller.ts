import type { SupabaseClient } from "@supabase/supabase-js";

import { forbidden, notFound } from "../lib/http-errors.js";
import type {
  CreateExamInput,
  ListExamsFilters,
  UpdateExamInput,
} from "../services/exams.service.js";
import { ExamsService } from "../services/exams.service.js";

export class ExamsController {
  private readonly service: ExamsService;

  constructor(supabase: SupabaseClient, userId: string) {
    this.service = new ExamsService(supabase, userId);
  }

  async list(filters: ListExamsFilters) {
    const exams = await this.service.listForUser(filters);

    return { exams };
  }

  async get(id: string) {
    const result = await this.service.getById(id);

    if (result.status === "foreign") {
      throw forbidden("Exam does not belong to the authenticated user.");
    }

    return {
      exam: result.status === "found" ? result.record : null,
    };
  }

  async create(input: CreateExamInput) {
    const exam = await this.service.createExam(input);

    return { exam };
  }

  async update(id: string, input: UpdateExamInput) {
    const result = await this.service.updateExam(id, input);

    if (result.status === "foreign") {
      throw forbidden("Exam does not belong to the authenticated user.");
    }

    if (result.status === "missing") {
      throw notFound("Exam not found.");
    }

    return {
      exam: result.status === "updated" ? result.record : null,
    };
  }

  async delete(id: string) {
    const result = await this.service.deleteExam(id);

    if (result.status === "foreign") {
      throw forbidden("Exam does not belong to the authenticated user.");
    }

    if (result.status === "missing") {
      throw notFound("Exam not found.");
    }

    return { ok: true };
  }
}

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Exam } from "@unilife-ai/types";

import { ExamsRepository } from "../repositories/exams.repository.js";

export type ListExamsFilters = {
  since?: string;
};

export type CreateExamInput = {
  id: string;
  class_id?: string | null;
  title: string;
  description?: string;
  exam_date: string;
  location?: string;
  created_at: string;
  updated_at: string;
};

export type UpdateExamInput = {
  class_id?: string | null;
  title?: string;
  description?: string | null;
  exam_date?: string;
  location?: string | null;
  updated_at: string;
};

type ExamLookupResult =
  | { status: "found"; record: Exam }
  | { status: "missing" }
  | { status: "foreign" };

type ExamUpdateResult =
  | { status: "updated"; record: Exam }
  | { status: "stale" }
  | { status: "missing" }
  | { status: "foreign" };

type ExamDeleteResult = { status: "deleted" } | { status: "missing" } | { status: "foreign" };

function isOlderTimestamp(incomingUpdatedAt: string, currentUpdatedAt: string) {
  return Date.parse(incomingUpdatedAt) < Date.parse(currentUpdatedAt);
}

export class ExamsService {
  private readonly repository: ExamsRepository;

  constructor(
    supabase: SupabaseClient,
    private readonly userId: string,
    repository = new ExamsRepository(supabase),
  ) {
    this.repository = repository;
  }

  async listForUser(filters: ListExamsFilters) {
    return this.repository.listForUser(this.userId, filters);
  }

  async getById(id: string): Promise<ExamLookupResult> {
    const existingRecord = await this.repository.findByIdForUser(id, this.userId);

    if (existingRecord) {
      return {
        status: "found",
        record: existingRecord,
      };
    }

    if (await this.repository.existsForOtherUser(id, this.userId)) {
      return { status: "foreign" };
    }

    return { status: "missing" };
  }

  async createExam(input: CreateExamInput) {
    const record: Exam = {
      id: input.id,
      user_id: this.userId,
      class_id: input.class_id ?? null,
      title: input.title,
      description: input.description ?? null,
      exam_date: input.exam_date,
      location: input.location ?? null,
      created_at: input.created_at,
      updated_at: input.updated_at,
      deleted_at: null,
    };

    return this.repository.create(record);
  }

  async updateExam(id: string, input: UpdateExamInput): Promise<ExamUpdateResult> {
    const existingRecord = await this.repository.findByIdForUser(id, this.userId);

    if (!existingRecord) {
      if (await this.repository.existsForOtherUser(id, this.userId)) {
        return { status: "foreign" };
      }

      return { status: "missing" };
    }

    if (isOlderTimestamp(input.updated_at, existingRecord.updated_at)) {
      return { status: "stale" };
    }

    const changes: Partial<Exam> = {
      updated_at: input.updated_at,
    };

    if (input.class_id !== undefined) {
      changes.class_id = input.class_id;
    }

    if (input.title !== undefined) {
      changes.title = input.title;
    }

    if (input.description !== undefined) {
      changes.description = input.description;
    }

    if (input.exam_date !== undefined) {
      changes.exam_date = input.exam_date;
    }

    if (input.location !== undefined) {
      changes.location = input.location;
    }

    const updatedRecord = await this.repository.updateForUser(id, this.userId, changes);

    if (!updatedRecord) {
      return { status: "missing" };
    }

    return {
      status: "updated",
      record: updatedRecord,
    };
  }

  async deleteExam(id: string): Promise<ExamDeleteResult> {
    const existingRecord = await this.repository.findByIdForUser(id, this.userId);

    if (!existingRecord) {
      if (await this.repository.existsForOtherUser(id, this.userId)) {
        return { status: "foreign" };
      }

      return { status: "missing" };
    }

    const deleted = await this.repository.softDeleteForUser(
      id,
      this.userId,
      new Date().toISOString(),
    );

    if (!deleted) {
      return { status: "missing" };
    }

    return { status: "deleted" };
  }
}

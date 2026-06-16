import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AcademicTerm,
  RecurrenceEditScope,
  ClassRecord,
  DayOfWeek,
  RecurrenceReference,
} from "@unilife-ai/types";

import { ClassesRepository } from "../repositories/classes.repository.js";
import { AcademicTermsRepository } from "../repositories/academic-terms.repository.js";

export type ListClassesFilters = {
  since?: string;
};

export type CreateClassInput = {
  id: string;
  term_id?: string | null;
  subject: string;
  room?: string;
  instructor?: string;
  day_of_week: DayOfWeek;
  start_time: string;
  end_time: string;
  color?: string;
  recurrence?: RecurrenceReference | null;
  created_at: string;
  updated_at: string;
};

export type UpdateClassInput = {
  term_id?: string | null;
  subject?: string;
  room?: string;
  instructor?: string;
  day_of_week?: DayOfWeek;
  start_time?: string;
  end_time?: string;
  color?: string;
  is_active?: boolean;
  recurrence?: RecurrenceReference | null;
  edit_scope?: RecurrenceEditScope;
  updated_at: string;
};

type ClassLookupResult =
  | { status: "found"; record: ClassRecord }
  | { status: "missing" }
  | { status: "foreign" };

type ClassUpdateResult =
  | { status: "updated"; record: ClassRecord }
  | { status: "stale" }
  | { status: "missing" }
  | { status: "foreign" };

type ClassDeleteResult = { status: "deleted" } | { status: "missing" } | { status: "foreign" };

function isOlderTimestamp(incomingUpdatedAt: string, currentUpdatedAt: string) {
  return Date.parse(incomingUpdatedAt) < Date.parse(currentUpdatedAt);
}

export class ClassesService {
  private readonly repository: ClassesRepository;
  private readonly termsRepository: AcademicTermsRepository;

  constructor(
    supabase: SupabaseClient,
    private readonly userId: string,
    repository = new ClassesRepository(supabase),
    termsRepository = new AcademicTermsRepository(supabase),
  ) {
    this.repository = repository;
    this.termsRepository = termsRepository;
  }

  async listForUser(filters: ListClassesFilters) {
    return this.repository.listForUser(this.userId, filters);
  }

  async getById(id: string): Promise<ClassLookupResult> {
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

  async createClass(input: CreateClassInput) {
    const termId = await this.resolveActiveTermId(input.term_id);
    const record: ClassRecord = {
      id: input.id,
      user_id: this.userId,
      term_id: termId,
      subject: input.subject,
      room: input.room ?? null,
      instructor: input.instructor ?? null,
      day_of_week: input.day_of_week,
      start_time: input.start_time,
      end_time: input.end_time,
      color: input.color ?? null,
      is_active: true,
      recurrence: input.recurrence ?? null,
      created_at: input.created_at,
      updated_at: input.updated_at,
      deleted_at: null,
    };

    return this.repository.create(record);
  }

  private async resolveActiveTermId(termId: string | null | undefined) {
    let term: AcademicTerm | null = null;
    if (termId) {
      term = await this.termsRepository.findByIdForUser(termId, this.userId);
      if (term?.status === "active") {
        return term.id;
      }
    }

    term = await this.termsRepository.findActiveForUser(this.userId);
    return term?.id ?? null;
  }

  async updateClass(id: string, input: UpdateClassInput): Promise<ClassUpdateResult> {
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

    const changes: Partial<ClassRecord> = {
      updated_at: input.updated_at,
    };

    if (input.subject !== undefined) {
      changes.subject = input.subject;
    }

    if (input.term_id !== undefined) {
      changes.term_id = input.term_id;
    }

    if (input.room !== undefined) {
      changes.room = input.room;
    }

    if (input.instructor !== undefined) {
      changes.instructor = input.instructor;
    }

    if (input.day_of_week !== undefined) {
      changes.day_of_week = input.day_of_week;
    }

    if (input.start_time !== undefined) {
      changes.start_time = input.start_time;
    }

    if (input.end_time !== undefined) {
      changes.end_time = input.end_time;
    }

    if (input.color !== undefined) {
      changes.color = input.color;
    }

    if (input.is_active !== undefined) {
      changes.is_active = input.is_active;
    }

    if (input.recurrence !== undefined) {
      changes.recurrence = input.recurrence;
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

  async deleteClass(id: string): Promise<ClassDeleteResult> {
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

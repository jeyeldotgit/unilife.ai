import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Assignment,
  AssignmentStatus,
  RecurrenceReference,
} from "@unilife-ai/types";

import { AssignmentsRepository } from "../repositories/assignments.repository.js";

export type ListAssignmentsFilters = {
  since?: string;
  status?: AssignmentStatus;
};

export type CreateAssignmentInput = {
  id: string;
  class_id?: string | null;
  title: string;
  description?: string;
  due_date: string;
  status?: AssignmentStatus;
  priority?: number;
  recurrence?: RecurrenceReference | null;
  created_at: string;
  updated_at: string;
};

export type UpdateAssignmentInput = {
  class_id?: string | null;
  title?: string;
  description?: string | null;
  due_date?: string;
  status?: AssignmentStatus;
  priority?: number;
  recurrence?: RecurrenceReference | null;
  edit_scope?: RecurrenceEditScope;
  updated_at: string;
};

type AssignmentLookupResult =
  | { status: "found"; record: Assignment }
  | { status: "missing" }
  | { status: "foreign" };

type AssignmentUpdateResult =
  | { status: "updated"; record: Assignment }
  | { status: "stale" }
  | { status: "missing" }
  | { status: "foreign" };

type AssignmentDeleteResult =
  | { status: "deleted" }
  | { status: "missing" }
  | { status: "foreign" };

function isOlderTimestamp(incomingUpdatedAt: string, currentUpdatedAt: string) {
  return Date.parse(incomingUpdatedAt) < Date.parse(currentUpdatedAt);
}

export class AssignmentsService {
  private readonly repository: AssignmentsRepository;

  constructor(
    supabase: SupabaseClient,
    private readonly userId: string,
    repository = new AssignmentsRepository(supabase),
  ) {
    this.repository = repository;
  }

  async listForUser(filters: ListAssignmentsFilters) {
    return this.repository.listForUser(this.userId, filters);
  }

  async getById(id: string): Promise<AssignmentLookupResult> {
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

  async createAssignment(input: CreateAssignmentInput) {
    const record: Assignment = {
      id: input.id,
      user_id: this.userId,
      class_id: input.class_id ?? null,
      title: input.title,
      description: input.description ?? null,
      due_date: input.due_date,
      status: input.status ?? "pending",
      priority: input.priority ?? 1,
      recurrence: input.recurrence ?? null,
      created_at: input.created_at,
      updated_at: input.updated_at,
      deleted_at: null,
    };

    return this.repository.create(record);
  }

  async updateAssignment(id: string, input: UpdateAssignmentInput): Promise<AssignmentUpdateResult> {
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

    const changes: Partial<Assignment> = {
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

    if (input.due_date !== undefined) {
      changes.due_date = input.due_date;
    }

    if (input.status !== undefined) {
      changes.status = input.status;
    }

    if (input.priority !== undefined) {
      changes.priority = input.priority;
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

  async deleteAssignment(id: string): Promise<AssignmentDeleteResult> {
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

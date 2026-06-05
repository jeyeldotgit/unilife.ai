import type { SupabaseClient } from "@supabase/supabase-js";

import { forbidden, notFound } from "../lib/http-errors.js";
import type {
  CreateAssignmentInput,
  ListAssignmentsFilters,
  UpdateAssignmentInput,
} from "../services/assignments.service.js";
import { AssignmentsService } from "../services/assignments.service.js";

export class AssignmentsController {
  private readonly service: AssignmentsService;

  constructor(supabase: SupabaseClient, userId: string) {
    this.service = new AssignmentsService(supabase, userId);
  }

  async list(filters: ListAssignmentsFilters) {
    const assignments = await this.service.listForUser(filters);

    return { assignments };
  }

  async get(id: string) {
    const result = await this.service.getById(id);

    if (result.status === "foreign") {
      throw forbidden("Assignment does not belong to the authenticated user.");
    }

    return {
      assignment: result.status === "found" ? result.record : null,
    };
  }

  async create(input: CreateAssignmentInput) {
    const assignment = await this.service.createAssignment(input);

    return { assignment };
  }

  async update(id: string, input: UpdateAssignmentInput) {
    const result = await this.service.updateAssignment(id, input);

    if (result.status === "foreign") {
      throw forbidden("Assignment does not belong to the authenticated user.");
    }

    if (result.status === "missing") {
      throw notFound("Assignment not found.");
    }

    return {
      assignment: result.status === "updated" ? result.record : null,
    };
  }

  async delete(id: string) {
    const result = await this.service.deleteAssignment(id);

    if (result.status === "foreign") {
      throw forbidden("Assignment does not belong to the authenticated user.");
    }

    if (result.status === "missing") {
      throw notFound("Assignment not found.");
    }

    return { ok: true };
  }
}

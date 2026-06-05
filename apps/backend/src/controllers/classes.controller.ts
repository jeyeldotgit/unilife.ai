import type { SupabaseClient } from "@supabase/supabase-js";

import { forbidden, notFound } from "../lib/http-errors.js";
import type {
  CreateClassInput,
  ListClassesFilters,
  UpdateClassInput,
} from "../services/classes.service.js";
import { ClassesService } from "../services/classes.service.js";

export class ClassesController {
  private readonly service: ClassesService;

  constructor(supabase: SupabaseClient, userId: string) {
    this.service = new ClassesService(supabase, userId);
  }

  async list(filters: ListClassesFilters) {
    const classes = await this.service.listForUser(filters);

    return { classes };
  }

  async get(id: string) {
    const result = await this.service.getById(id);

    if (result.status === "foreign") {
      throw forbidden("Class does not belong to the authenticated user.");
    }

    return {
      class: result.status === "found" ? result.record : null,
    };
  }

  async create(input: CreateClassInput) {
    const classRecord = await this.service.createClass(input);

    return { class: classRecord };
  }

  async update(id: string, input: UpdateClassInput) {
    const result = await this.service.updateClass(id, input);

    if (result.status === "foreign") {
      throw forbidden("Class does not belong to the authenticated user.");
    }

    if (result.status === "missing") {
      throw notFound("Class not found.");
    }

    return {
      class: result.status === "updated" ? result.record : null,
    };
  }

  async delete(id: string) {
    const result = await this.service.deleteClass(id);

    if (result.status === "foreign") {
      throw forbidden("Class does not belong to the authenticated user.");
    }

    if (result.status === "missing") {
      throw notFound("Class not found.");
    }

    return { ok: true };
  }
}

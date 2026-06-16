import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  ConfirmScheduleImportInput,
  CreateScheduleImportInput,
} from "../services/schedule-imports.service.js";
import { ScheduleImportsService } from "../services/schedule-imports.service.js";

export class ScheduleImportsController {
  private readonly service: ScheduleImportsService;

  constructor(supabase: SupabaseClient, userId: string) {
    this.service = new ScheduleImportsService(supabase, userId);
  }

  async create(input: CreateScheduleImportInput) {
    return this.service.create(input);
  }

  async get(id: string) {
    return this.service.get(id);
  }

  async confirm(id: string, input: ConfirmScheduleImportInput) {
    return this.service.confirm(id, input);
  }

  async deleteSource(id: string) {
    return this.service.deleteSource(id);
  }
}

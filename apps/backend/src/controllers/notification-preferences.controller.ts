import type { SupabaseClient } from "@supabase/supabase-js";

import type { UpdateNotificationSettingsInput } from "../services/notification-preferences.service.js";
import { NotificationPreferencesService } from "../services/notification-preferences.service.js";

export class NotificationPreferencesController {
  private readonly service: NotificationPreferencesService;

  constructor(supabase: SupabaseClient, userId: string) {
    this.service = new NotificationPreferencesService(supabase, userId);
  }

  async get() {
    return { settings: await this.service.getSettings() };
  }

  async update(input: UpdateNotificationSettingsInput) {
    return { settings: await this.service.updateSettings(input) };
  }
}

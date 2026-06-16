import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  NotificationCategory,
  NotificationPreference,
  NotificationSettings,
} from "@unilife-ai/types";

import { NotificationPreferencesRepository } from "../repositories/notification-preferences.repository.js";
import { ProfileRepository } from "../repositories/profile.repository.js";

export const NOTIFICATION_CATEGORIES: NotificationCategory[] = [
  "class",
  "assignment",
  "exam",
  "budget_alert",
  "daily_briefing",
];

export type UpdateNotificationSettingsInput = {
  quiet_hours_enabled?: boolean;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
  preferences?: NotificationPreference[];
};

export function defaultNotificationPreferences(): NotificationPreference[] {
  return NOTIFICATION_CATEGORIES.map((category) => ({
    category,
    enabled: true,
    urgent_bypass_enabled: false,
    escalation_limit: 3,
  }));
}

export class NotificationPreferencesService {
  constructor(
    supabase: SupabaseClient,
    private readonly userId: string,
    private readonly preferencesRepository = new NotificationPreferencesRepository(supabase),
    private readonly profileRepository = new ProfileRepository(supabase),
  ) {}

  async getSettings(): Promise<NotificationSettings> {
    const [profile, stored] = await Promise.all([
      this.profileRepository.findById(this.userId),
      this.preferencesRepository.listForUser(this.userId),
    ]);
    const storedByCategory = new Map(stored.map((item) => [item.category, item]));
    const profileSettings = profile as unknown as Record<string, unknown> | null;

    return {
      user_id: this.userId,
      timezone: profile?.timezone ?? "UTC",
      quiet_hours_enabled:
        profileSettings?.quiet_hours_enabled !== false,
      quiet_hours_start:
        String(profileSettings?.quiet_hours_start ?? "22:00"),
      quiet_hours_end:
        String(profileSettings?.quiet_hours_end ?? "07:00"),
      preferences: defaultNotificationPreferences().map((item) => {
        const storedPreference = storedByCategory.get(item.category);
        return storedPreference
          ? {
              category: storedPreference.category,
              enabled: storedPreference.enabled,
              urgent_bypass_enabled: storedPreference.urgent_bypass_enabled,
              escalation_limit: storedPreference.escalation_limit,
            }
          : item;
      }),
      updated_at: profile?.updated_at ?? new Date(0).toISOString(),
    };
  }

  async updateSettings(input: UpdateNotificationSettingsInput) {
    const changes: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (input.quiet_hours_enabled !== undefined) {
      changes.quiet_hours_enabled = input.quiet_hours_enabled;
    }
    if (input.quiet_hours_start !== undefined) {
      changes.quiet_hours_start = input.quiet_hours_start;
    }
    if (input.quiet_hours_end !== undefined) {
      changes.quiet_hours_end = input.quiet_hours_end;
    }

    await Promise.all([
      Object.keys(changes).length > 1
        ? this.profileRepository.updateById(this.userId, changes)
        : Promise.resolve(),
      input.preferences?.length
        ? this.preferencesRepository.upsertForUser(this.userId, input.preferences)
        : Promise.resolve(),
    ]);

    return this.getSettings();
  }
}

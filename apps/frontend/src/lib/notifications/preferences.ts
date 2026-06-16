import type {
  NotificationCategory,
  NotificationPreference,
  NotificationSettings,
} from "@unilife-ai/types";

import { requestBackendClient } from "@/lib/api/client-browser";
import { db } from "@/lib/db/dexie";

export const NOTIFICATION_CATEGORIES: NotificationCategory[] = [
  "class",
  "assignment",
  "exam",
  "budget_alert",
  "daily_briefing",
];

export function createDefaultNotificationSettings(
  userId: string,
  timezone = "UTC",
): NotificationSettings {
  return {
    user_id: userId,
    timezone,
    quiet_hours_enabled: true,
    quiet_hours_start: "22:00",
    quiet_hours_end: "07:00",
    preferences: NOTIFICATION_CATEGORIES.map((category) => ({
      category,
      enabled: true,
      urgent_bypass_enabled: false,
      escalation_limit: 3,
    })),
    updated_at: new Date(0).toISOString(),
  };
}

export function getCategoryPreference(
  settings: NotificationSettings,
  category: NotificationCategory,
): NotificationPreference {
  return settings.preferences.find((item) => item.category === category) ?? {
    category,
    enabled: true,
    urgent_bypass_enabled: false,
    escalation_limit: 3,
  };
}

export async function getCachedNotificationSettings(userId: string, timezone = "UTC") {
  return (await db.notification_settings.get(userId)) ??
    createDefaultNotificationSettings(userId, timezone);
}

export async function fetchNotificationSettings(userId: string, fallbackTimeZone?: string) {
  try {
    const response = await requestBackendClient<{ settings: NotificationSettings }>(
      "/api/notification-preferences",
    );
    const settings =
      response.settings.timezone === "UTC" && fallbackTimeZone
        ? { ...response.settings, timezone: fallbackTimeZone }
        : response.settings;
    await db.notification_settings.put(settings);
    return settings;
  } catch {
    return getCachedNotificationSettings(userId, fallbackTimeZone);
  }
}

export async function updateNotificationSettings(
  input: Partial<Omit<NotificationSettings, "user_id" | "timezone" | "updated_at">> & {
    userId: string;
    timezone: string;
  },
) {
  const { timezone, userId, ...settingsInput } = input;
  const current = await getCachedNotificationSettings(userId, timezone);
  const localSettings: NotificationSettings = {
    ...current,
    ...settingsInput,
    timezone: current.timezone || timezone,
    updated_at: new Date().toISOString(),
  };

  await db.notification_settings.put(localSettings);

  try {
    const response = await requestBackendClient<{ settings: NotificationSettings }>(
      "/api/notification-preferences",
      { method: "PATCH", body: settingsInput },
    );
    await db.notification_settings.put(response.settings);
    return response.settings;
  } catch {
    return localSettings;
  }
}

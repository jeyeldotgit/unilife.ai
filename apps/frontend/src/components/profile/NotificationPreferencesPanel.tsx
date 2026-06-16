"use client";

import { useEffect, useState } from "react";
import type { NotificationSettings } from "@unilife-ai/types";

import {
  createDefaultNotificationSettings,
  fetchNotificationSettings,
  updateNotificationSettings,
} from "@/lib/notifications/preferences";
import { MutationStatus } from "@/components/ui/MutationStatus";
import { RecoverableError } from "@/components/ui/RecoverableError";

const LABELS = {
  class: "Classes",
  assignment: "Assignments",
  exam: "Exams",
  budget_alert: "Budget alerts",
  daily_briefing: "Daily briefing",
} as const;

export function NotificationPreferencesPanel({
  userId,
  timezone,
}: {
  userId: string;
  timezone: string;
}) {
  const [settings, setSettings] = useState<NotificationSettings>(
    createDefaultNotificationSettings(userId, timezone),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetchNotificationSettings(userId, timezone)
      .then(setSettings)
      .catch(() => setError("Notification preferences could not be refreshed."));
  }, [timezone, userId]);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      setSettings(
        await updateNotificationSettings({
          preferences: settings.preferences,
          quiet_hours_enabled: settings.quiet_hours_enabled,
          quiet_hours_start: settings.quiet_hours_start,
          quiet_hours_end: settings.quiet_hours_end,
        }),
      );
      window.dispatchEvent(new Event("unilife:notification-permission"));
    } catch {
      setError("Notification preferences could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-3xl border border-[#c2c6d6]/40 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold">Notification preferences</h2>
      <p className="mt-1 text-sm text-[#424754]">
        Quiet hours use {settings.timezone || timezone}. Urgent bypass is always explicit.
      </p>
      {error ? <RecoverableError className="mt-4" title="Preferences unavailable" message={error} /> : null}
      <label className="mt-5 flex items-center justify-between gap-3 text-sm font-semibold">
        Enable quiet hours
        <input type="checkbox" checked={settings.quiet_hours_enabled} onChange={(event) => setSettings({ ...settings, quiet_hours_enabled: event.target.checked })} />
      </label>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <label className="text-sm">Start<input className="mt-1 w-full rounded-xl border p-2" type="time" value={settings.quiet_hours_start} onChange={(event) => setSettings({ ...settings, quiet_hours_start: event.target.value })} /></label>
        <label className="text-sm">End<input className="mt-1 w-full rounded-xl border p-2" type="time" value={settings.quiet_hours_end} onChange={(event) => setSettings({ ...settings, quiet_hours_end: event.target.value })} /></label>
      </div>
      <div className="mt-5 space-y-3">
        {settings.preferences.map((preference, index) => {
          if (!preference.category) return null;
          const label = LABELS[preference.category];

          return (
          <div className="rounded-2xl bg-[#f3f4f5] p-4" key={preference.category}>
            <div className="flex items-center justify-between gap-3">
              <span className="font-semibold">{label}</span>
              <input type="checkbox" aria-label={`Enable ${label}`} checked={preference.enabled} onChange={(event) => setSettings({ ...settings, preferences: settings.preferences.map((item, itemIndex) => itemIndex === index ? { ...item, enabled: event.target.checked } : item) })} />
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm">
              <label className="flex items-center gap-2"><input type="checkbox" checked={preference.urgent_bypass_enabled} onChange={(event) => setSettings({ ...settings, preferences: settings.preferences.map((item, itemIndex) => itemIndex === index ? { ...item, urgent_bypass_enabled: event.target.checked } : item) })} />Urgent bypass</label>
              <label className="flex items-center gap-2">Reminder limit<select className="rounded-lg border bg-white p-1" value={preference.escalation_limit} onChange={(event) => setSettings({ ...settings, preferences: settings.preferences.map((item, itemIndex) => itemIndex === index ? { ...item, escalation_limit: Number(event.target.value) } : item) })}>{[0, 1, 2, 3].map((limit) => <option key={limit} value={limit}>{limit}</option>)}</select></label>
            </div>
          </div>
          );
        })}
      </div>
      <div className="mt-5 flex items-center gap-3">
        <button className="rounded-full bg-[#0058be] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60" disabled={saving} onClick={() => void save()} type="button">{saving ? "Saving..." : "Save notification preferences"}</button>
        <MutationStatus state={saving ? "pending" : "idle"} />
      </div>
    </section>
  );
}

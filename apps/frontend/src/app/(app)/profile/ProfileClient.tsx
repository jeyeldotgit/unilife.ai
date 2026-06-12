"use client";

import { useEffect, useMemo, useState } from "react";
import { updateProfile } from "@/lib/api/profile-client";
import { AuthenticatedPageHeader } from "@/components/profile/AuthenticatedPageHeader";
import { AvatarPicker } from "@/components/profile/AvatarPicker";
import { useProfile } from "@/components/profile/ProfileContext";
import { deleteAvatarByUrl, isUserOwnedAvatarUrl } from "@/lib/profile/avatar-storage";

const COMMON_TIME_ZONES = [
  "Asia/Manila",
  "Asia/Singapore",
  "UTC",
  "America/Los_Angeles",
  "America/New_York",
] as const;

export default function ProfileClient() {
  const { profile, refreshProfile, resolvedTimeZone, setProfile } = useProfile();
  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile?.avatar_url ?? null);
  const [timezone, setTimezone] = useState(profile?.timezone ?? resolvedTimeZone);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDisplayName(profile?.display_name ?? "");
    setAvatarUrl(profile?.avatar_url ?? null);
    setTimezone(profile?.timezone ?? resolvedTimeZone);
  }, [profile, resolvedTimeZone]);

  const availableTimeZones = useMemo(
    () => Array.from(new Set([...COMMON_TIME_ZONES, ...Intl.supportedValuesOf("timeZone")])),
    [],
  );

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] pb-32 font-sans text-[#191c1d]">
        <AuthenticatedPageHeader pageTitle="Profile" />
        <main className="mx-auto max-w-2xl px-4 pt-6">
          <div className="rounded-xl border border-[#ffddb8] bg-[#fff8f1] px-4 py-3 text-sm font-medium text-[#825100] shadow-sm">
            We couldn&apos;t load your profile right now. Try again in a moment.
          </div>
        </main>
      </div>
    );
  }

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    const previousAvatarUrl = profile.avatar_url;

    try {
      const nextProfile = await updateProfile({
        avatar_url: avatarUrl,
        display_name: displayName.trim() || null,
        timezone: timezone || null,
      });

      setProfile(nextProfile);

      if (
        previousAvatarUrl &&
        previousAvatarUrl !== nextProfile.avatar_url &&
        isUserOwnedAvatarUrl(previousAvatarUrl, profile.id)
      ) {
        await deleteAvatarByUrl(previousAvatarUrl);
      }
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "We couldn't save your profile right now.",
      );
    } finally {
      setSaving(false);
      await refreshProfile();
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] pb-32 font-sans text-[#191c1d]">
      <AuthenticatedPageHeader pageTitle="Profile" />

      <main className="mx-auto max-w-2xl space-y-6 px-4 pt-6">
        <section className="rounded-3xl border border-[#c2c6d6]/40 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-[#191c1d]">Your identity</h2>
          <p className="mt-1 text-sm text-[#424754]">
            Manage the name, avatar, and timezone shown across authenticated pages.
          </p>

          <div className="mt-6 space-y-5">
            <AvatarPicker
              avatarUrl={avatarUrl}
              displayName={displayName}
              onChange={setAvatarUrl}
              userId={profile.id}
            />

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-[#191c1d]">
                Display name
              </span>
              <input
                className="w-full rounded-2xl border border-[#c2c6d6] px-4 py-3 text-sm outline-none focus:border-[#3B82F6]"
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="How should we greet you?"
                value={displayName}
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-[#191c1d]">
                Timezone
              </span>
              <select
                className="w-full rounded-2xl border border-[#c2c6d6] px-4 py-3 text-sm outline-none focus:border-[#3B82F6]"
                onChange={(event) => setTimezone(event.target.value)}
                value={timezone}
              >
                {availableTimeZones.map((timeZoneOption) => (
                  <option key={timeZoneOption} value={timeZoneOption}>
                    {timeZoneOption}
                  </option>
                ))}
              </select>
            </label>

            {error ? (
              <div className="rounded-xl border border-[#ffdad6] bg-[#fff8f7] px-4 py-3 text-sm font-medium text-[#ba1a1a]">
                {error}
              </div>
            ) : null}

            <button
              className="rounded-full bg-[#0058be] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[#0058be]/20"
              onClick={() => {
                void handleSave();
              }}
              type="button"
            >
              {saving ? "Saving..." : "Save profile"}
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

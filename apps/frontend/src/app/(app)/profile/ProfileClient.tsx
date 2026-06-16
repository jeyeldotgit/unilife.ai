"use client";

import { useMemo, useState } from "react";
import type { UserProfile } from "@unilife-ai/types";
import { updateProfile } from "@/lib/api/profile-client";
import { AuthenticatedPageHeader } from "@/components/profile/AuthenticatedPageHeader";
import { AvatarPicker } from "@/components/profile/AvatarPicker";
import { useProfile } from "@/components/profile/ProfileContext";
import { FieldErrorMessage, FormErrorSummary } from "@/components/ui/FormErrorSummary";
import { MutationStatus } from "@/components/ui/MutationStatus";
import { RecoverableError } from "@/components/ui/RecoverableError";
import { fieldErrorMessage, normalizeRecoverableError } from "@/lib/errors/recoverable";
import { deleteAvatarByUrl, isUserOwnedAvatarUrl } from "@/lib/profile/avatar-storage";
import { NotificationPreferencesPanel } from "@/components/profile/NotificationPreferencesPanel";
import { SyncRecoveryPanel } from "@/components/profile/SyncRecoveryPanel";

const COMMON_TIME_ZONES = [
  "Asia/Manila",
  "Asia/Singapore",
  "UTC",
  "America/Los_Angeles",
  "America/New_York",
] as const;

export default function ProfileClient({
  pageTitle = "Profile",
  showOperationalPanels = true,
}: {
  pageTitle?: string;
  showOperationalPanels?: boolean;
} = {}) {
  const { profile, refreshProfile, resolvedTimeZone, setProfile } = useProfile();

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] pb-32 font-sans text-[#191c1d]">
        <AuthenticatedPageHeader pageTitle={pageTitle} />
        <main className="mx-auto max-w-2xl px-4 pt-6">
          <RecoverableError
            tone="warning"
            title="Profile unavailable"
            message="We couldn’t load your profile right now. Try again in a moment."
          />
        </main>
      </div>
    );
  }

  const profileFormKey = [
    profile.id,
    profile.updated_at,
    profile.display_name ?? "",
    profile.avatar_url ?? "",
    profile.timezone ?? resolvedTimeZone,
  ].join(":");

  return (
    <ProfileFormContent
      key={profileFormKey}
      profile={profile}
      refreshProfile={refreshProfile}
      resolvedTimeZone={resolvedTimeZone}
      setProfile={setProfile}
      pageTitle={pageTitle}
      showOperationalPanels={showOperationalPanels}
    />
  );
}

function ProfileFormContent({
  profile,
  refreshProfile,
  resolvedTimeZone,
  setProfile,
  pageTitle,
  showOperationalPanels,
}: {
  profile: UserProfile;
  refreshProfile: () => Promise<void>;
  resolvedTimeZone: string;
  setProfile: (profile: UserProfile | null) => void;
  pageTitle: string;
  showOperationalPanels: boolean;
}) {
  const [displayName, setDisplayName] = useState(profile.display_name ?? "");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile.avatar_url ?? null);
  const [timezone, setTimezone] = useState(profile.timezone ?? resolvedTimeZone);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]> | undefined>();
  const [saving, setSaving] = useState(false);
  const [mutationState, setMutationState] = useState<"idle" | "pending" | "queued" | "failed">(
    "idle",
  );

  const availableTimeZones = useMemo(
    () => Array.from(new Set([...COMMON_TIME_ZONES, ...Intl.supportedValuesOf("timeZone")])),
    [],
  );

  const handleSave = async () => {
    const nextFieldErrors: Record<string, string[]> = {};
    if (displayName.trim().length > 80) {
      nextFieldErrors.display_name = ["Display name must stay under 80 characters."];
    }
    if (timezone.trim().length === 0) {
      nextFieldErrors.timezone = ["Timezone is required."];
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      setMutationState("failed");
      return;
    }

    setSaving(true);
    setError(null);
    setFieldErrors(undefined);
    setMutationState("pending");
    let shouldRefresh = false;

    const previousAvatarUrl = profile.avatar_url;

    try {
      const nextProfile = await updateProfile({
        avatar_url: avatarUrl,
        display_name: displayName.trim() || null,
        timezone: timezone || null,
      });

      setProfile(nextProfile);
      setMutationState("queued");
      shouldRefresh = true;

      if (
        previousAvatarUrl &&
        previousAvatarUrl !== nextProfile.avatar_url &&
        isUserOwnedAvatarUrl(previousAvatarUrl, profile.id)
      ) {
        await deleteAvatarByUrl(previousAvatarUrl);
      }
    } catch (nextError) {
      const recoverable = normalizeRecoverableError(nextError);
      setError(recoverable.message);
      setFieldErrors(recoverable.fieldErrors);
      setMutationState("failed");
    } finally {
      setSaving(false);
      if (shouldRefresh) {
        await refreshProfile();
      }
      window.setTimeout(() => setMutationState("idle"), 1500);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] pb-32 font-sans text-[#191c1d]">
      <AuthenticatedPageHeader pageTitle={pageTitle} />

      <main className="mx-auto max-w-2xl space-y-6 px-4 pt-6">
        <section className="rounded-3xl border border-[#c2c6d6]/40 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-[#191c1d]">Your identity</h2>
          <p className="mt-1 text-sm text-[#424754]">
            Manage the name, avatar, and timezone shown across authenticated pages.
          </p>

          <div className="mt-6 space-y-5">
            <FormErrorSummary
              formId="profile-form"
              fieldErrors={fieldErrors}
              message={error}
            />

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
                id="profile-form-display_name"
                className="w-full rounded-2xl border border-[#c2c6d6] px-4 py-3 text-sm outline-none focus:border-[#3B82F6]"
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="How should we greet you?"
                value={displayName}
                aria-describedby={
                  fieldErrorMessage(fieldErrors, "display_name")
                    ? "profile-form-display_name-error"
                    : undefined
                }
              />
              <FieldErrorMessage
                field="display_name"
                error={fieldErrorMessage(fieldErrors, "display_name")}
                formId="profile-form"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-[#191c1d]">
                Timezone
              </span>
              <select
                id="profile-form-timezone"
                className="w-full rounded-2xl border border-[#c2c6d6] px-4 py-3 text-sm outline-none focus:border-[#3B82F6]"
                onChange={(event) => setTimezone(event.target.value)}
                value={timezone}
                aria-describedby={
                  fieldErrorMessage(fieldErrors, "timezone")
                    ? "profile-form-timezone-error"
                    : undefined
                }
              >
                {availableTimeZones.map((timeZoneOption) => (
                  <option key={timeZoneOption} value={timeZoneOption}>
                    {timeZoneOption}
                  </option>
                ))}
              </select>
              <FieldErrorMessage
                field="timezone"
                error={fieldErrorMessage(fieldErrors, "timezone")}
                formId="profile-form"
              />
            </label>

            <MutationStatus
              state={saving ? "pending" : mutationState}
              label={
                mutationState === "queued"
                  ? "Profile changes saved successfully."
                  : undefined
              }
            />

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
        {showOperationalPanels ? (
          <>
            <NotificationPreferencesPanel userId={profile.id} timezone={timezone} />
            <SyncRecoveryPanel userId={profile.id} />
          </>
        ) : null}
      </main>
    </div>
  );
}

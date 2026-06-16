"use client";

import { AuthenticatedPageHeader } from "@/components/profile/AuthenticatedPageHeader";
import { NotificationPreferencesPanel } from "@/components/profile/NotificationPreferencesPanel";
import { useProfile } from "@/components/profile/ProfileContext";

export default function NotificationSettingsPage() {
  const { profile, resolvedTimeZone } = useProfile();

  return (
    <div className="min-h-screen bg-[#f8f9fa] pb-32 font-sans text-[#191c1d]">
      <AuthenticatedPageHeader pageTitle="Notifications" />
      <main className="mx-auto max-w-2xl px-4 pt-6">
        {profile ? (
          <NotificationPreferencesPanel userId={profile.id} timezone={profile.timezone ?? resolvedTimeZone} />
        ) : null}
      </main>
    </div>
  );
}

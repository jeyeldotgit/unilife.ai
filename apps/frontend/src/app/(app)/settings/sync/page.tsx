"use client";

import { AuthenticatedPageHeader } from "@/components/profile/AuthenticatedPageHeader";
import { SyncRecoveryPanel } from "@/components/profile/SyncRecoveryPanel";
import { useProfile } from "@/components/profile/ProfileContext";

export default function SyncSettingsPage() {
  const { profile } = useProfile();

  return (
    <div className="min-h-screen bg-[#f8f9fa] pb-32 font-sans text-[#191c1d]">
      <AuthenticatedPageHeader pageTitle="Sync Status" />
      <main className="mx-auto max-w-2xl px-4 pt-6">
        {profile ? <SyncRecoveryPanel userId={profile.id} /> : null}
      </main>
    </div>
  );
}

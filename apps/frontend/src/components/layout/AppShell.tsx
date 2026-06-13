"use client";

import { useEffect, type ReactNode } from "react";
import type { UserProfile } from "@unilife-ai/types";
import { BottomNav } from "@/components/layout/BottomNav";
import { OfflineBanner } from "@/components/layout/OfflineBanner";
import { ProfileProvider } from "@/components/profile/ProfileContext";
import { DeleteUndoToastProvider } from "@/components/ui/DeleteUndoToast";
import { setCurrentUserId } from "@/lib/session/current-user";
import { createSyncEngine } from "@/lib/sync/sync-engine";
import { createReminderRuntime } from "@/lib/notifications/runtime";

export function AppShell({
  children,
  initialProfile,
  userId,
}: {
  children: ReactNode;
  initialProfile: UserProfile | null;
  userId: string;
}) {
  setCurrentUserId(userId);

  useEffect(() => {
    const engine = createSyncEngine({ userId });
    const reminderRuntime = createReminderRuntime(userId);
    engine.start();
    reminderRuntime.start();

    return () => {
      engine.stop();
      reminderRuntime.stop();
    };
  }, [userId]);

  return (
    <ProfileProvider initialProfile={initialProfile}>
      <DeleteUndoToastProvider>
        <OfflineBanner />
        {children}
        <BottomNav />
      </DeleteUndoToastProvider>
    </ProfileProvider>
  );
}

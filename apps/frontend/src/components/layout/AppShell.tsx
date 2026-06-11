"use client";

import { useEffect, type ReactNode } from "react";
import { BottomNav } from "@/components/layout/BottomNav";
import { OfflineBanner } from "@/components/layout/OfflineBanner";
import { setCurrentUserId } from "@/lib/session/current-user";
import { createSyncEngine } from "@/lib/sync/sync-engine";

export function AppShell({
  children,
  userId,
}: {
  children: ReactNode;
  userId: string;
}) {
  setCurrentUserId(userId);

  useEffect(() => {
    const engine = createSyncEngine({ userId });
    engine.start();

    return () => {
      engine.stop();
    };
  }, [userId]);

  return (
    <>
      <OfflineBanner />
      {children}
      <BottomNav />
    </>
  );
}

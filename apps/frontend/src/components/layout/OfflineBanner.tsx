"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";

import { useSyncStatus } from "@/hooks/use-sync-status";
import { Icon } from "@/components/ui/Icon";

type BannerState = "hidden" | "offline" | "syncing" | "synced" | "failed";

export function OfflineBanner() {
  const syncStatus = useSyncStatus();
  const [bannerState, setBannerState] = useState<BannerState>("hidden");
  const wasOfflineRef = useRef(!syncStatus.isOnline);
  const syncTimeoutRef = useRef<number | null>(null);

  const clearSyncTimeout = useEffectEvent(() => {
    if (syncTimeoutRef.current !== null) {
      window.clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = null;
    }
  });

  const showSyncedState = useEffectEvent(() => {
    wasOfflineRef.current = false;
    setBannerState("synced");
    syncTimeoutRef.current = window.setTimeout(() => {
      setBannerState("hidden");
      syncTimeoutRef.current = null;
    }, 3000);
  });

  useEffect(() => {
    clearSyncTimeout();

    if (!syncStatus.isOnline) {
      wasOfflineRef.current = true;
      setBannerState("offline");
      return;
    }

    if (syncStatus.phase === "syncing") {
      setBannerState("syncing");
      return;
    }

    if (syncStatus.phase === "failed" && syncStatus.failedCount > 0) {
      wasOfflineRef.current = false;
      setBannerState("failed");
      return;
    }

    if (syncStatus.phase === "synced" && wasOfflineRef.current) {
      showSyncedState();
      return;
    }

    setBannerState("hidden");
  }, [
    clearSyncTimeout,
    showSyncedState,
    syncStatus.failedCount,
    syncStatus.isOnline,
    syncStatus.phase,
  ]);

  if (bannerState === "hidden") {
    return null;
  }

  const synced = bannerState === "synced";
  const syncing = bannerState === "syncing";
  const failed = bannerState === "failed";

  return (
    <div className="pointer-events-none fixed left-1/2 top-4 z-[60] -translate-x-1/2">
      <div
        className={
          synced
            ? "flex items-center gap-2 rounded-full bg-[#dff7e8] px-4 py-2 text-xs font-semibold text-[#00714d] shadow-sm ring-1 ring-[#6cf8bb]"
            : failed
              ? "flex items-center gap-2 rounded-full bg-[#fff8f7] px-4 py-2 text-xs font-semibold text-[#ba1a1a] shadow-sm ring-1 ring-[#ffdad6]"
              : "flex items-center gap-2 rounded-full bg-[#2a3033] px-4 py-2 text-xs font-semibold text-white shadow-sm"
        }
      >
        {synced ? (
          <Icon name="check_circle" filled className="text-[16px]" />
        ) : failed ? (
          <Icon name="sync_problem" className="text-[16px]" />
        ) : syncing ? (
          <Icon name="sync" className="text-[16px]" />
        ) : (
          <span className="h-2 w-2 rounded-full bg-[#6cf8bb]" />
        )}
        <span>
          {synced
            ? "Synced - all changes saved"
            : failed
              ? "Some changes still need attention"
              : syncing
                ? "Back online - syncing changes"
                : "Offline - changes saved"}
        </span>
      </div>
    </div>
  );
}

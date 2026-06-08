"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";

type BannerState = "hidden" | "offline" | "synced";

export function OfflineBanner() {
  const [bannerState, setBannerState] = useState<BannerState>(() => {
    if (typeof navigator === "undefined") {
      return "hidden";
    }

    return navigator.onLine ? "hidden" : "offline";
  });
  const wasOfflineRef = useRef(
    typeof navigator !== "undefined" ? !navigator.onLine : false,
  );
  const syncTimeoutRef = useRef<number | null>(null);

  const clearSyncTimeout = useEffectEvent(() => {
    if (syncTimeoutRef.current !== null) {
      window.clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = null;
    }
  });

  const updateBannerState = useEffectEvent((online: boolean) => {
    clearSyncTimeout();

    if (!online) {
      wasOfflineRef.current = true;
      setBannerState("offline");
      return;
    }

    if (wasOfflineRef.current) {
      wasOfflineRef.current = false;
      setBannerState("synced");
      syncTimeoutRef.current = window.setTimeout(() => {
        setBannerState("hidden");
        syncTimeoutRef.current = null;
      }, 3000);
      return;
    }

    setBannerState("hidden");
  });

  useEffect(() => {
    const handleOnline = () => updateBannerState(true);
    const handleOffline = () => updateBannerState(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      clearSyncTimeout();
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (bannerState === "hidden") {
    return null;
  }

  const synced = bannerState === "synced";

  return (
    <div className="pointer-events-none fixed left-1/2 top-4 z-[60] -translate-x-1/2">
      <div
        className={
          synced
            ? "flex items-center gap-2 rounded-full bg-[#dff7e8] px-4 py-2 text-xs font-semibold text-[#00714d] shadow-sm ring-1 ring-[#6cf8bb]"
            : "flex items-center gap-2 rounded-full bg-[#2a3033] px-4 py-2 text-xs font-semibold text-white shadow-sm"
        }
      >
        {synced ? (
          <Icon name="check_circle" filled className="text-[16px]" />
        ) : (
          <span className="h-2 w-2 rounded-full bg-[#6cf8bb]" />
        )}
        <span>
          {synced
            ? "Synced - all changes saved"
            : "Offline - changes saved"}
        </span>
      </div>
    </div>
  );
}

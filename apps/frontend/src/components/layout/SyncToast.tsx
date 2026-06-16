"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import {
  SYNC_FAILED_EVENT,
  SYNC_PENDING_EVENT,
  SYNC_SUCCESS_EVENT,
  type SyncFailedDetail,
  type SyncPendingDetail,
  type SyncSuccessDetail,
} from "@/lib/sync/sync-events";

type ToastState =
  | { kind: "hidden" }
  | { kind: "pending"; label: string }
  | { kind: "success"; label: string }
  | { kind: "failed"; label: string };

export function SyncToast() {
  const [state, setState] = useState<ToastState>({ kind: "hidden" });

  useEffect(() => {
    let timeoutId: number | null = null;
    const clear = () => {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
        timeoutId = null;
      }
    };
    const onPending = (event: Event) => {
      clear();
      const detail = (event as CustomEvent<SyncPendingDetail>).detail;
      setState({ kind: "pending", label: detail.count > 1 ? `Saving ${detail.count} items...` : "Saving..." });
    };
    const onSuccess = (event: Event) => {
      clear();
      const detail = (event as CustomEvent<SyncSuccessDetail>).detail;
      setState({ kind: "success", label: detail.count > 1 ? `Saved ${detail.count} items` : "Saved" });
      timeoutId = window.setTimeout(() => setState({ kind: "hidden" }), 3000);
    };
    const onFailed = (event: Event) => {
      clear();
      const detail = (event as CustomEvent<SyncFailedDetail>).detail;
      setState({ kind: "failed", label: detail.count > 1 ? `Couldn't save ${detail.count} items - tap to retry` : "Couldn't save - tap to retry" });
    };

    window.addEventListener(SYNC_PENDING_EVENT, onPending);
    window.addEventListener(SYNC_SUCCESS_EVENT, onSuccess);
    window.addEventListener(SYNC_FAILED_EVENT, onFailed);

    return () => {
      clear();
      window.removeEventListener(SYNC_PENDING_EVENT, onPending);
      window.removeEventListener(SYNC_SUCCESS_EVENT, onSuccess);
      window.removeEventListener(SYNC_FAILED_EVENT, onFailed);
    };
  }, []);

  if (state.kind === "hidden") return null;

  const classes =
    state.kind === "success"
      ? "bg-[#dff7e8] text-[#00714d] ring-[#6cf8bb]"
      : state.kind === "failed"
        ? "bg-[#fff8f7] text-[#ba1a1a] ring-[#ffdad6]"
        : "bg-white text-[#424754] ring-[#c2c6d6]";

  return (
    <div className="fixed left-1/2 top-20 z-[65] -translate-x-1/2">
      <div className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold shadow-sm ring-1 ${classes}`}>
        <Icon
          name={state.kind === "success" ? "check_circle" : state.kind === "failed" ? "sync_problem" : "sync"}
          filled={state.kind === "success"}
          className="text-[16px]"
        />
        {state.label}
      </div>
    </div>
  );
}

"use client";

import { useSyncExternalStore } from "react";

import {
  getSyncStatusState,
  subscribeSyncStatus,
} from "@/lib/sync/sync-status";

export function useSyncStatus() {
  return useSyncExternalStore(
    subscribeSyncStatus,
    getSyncStatusState,
    getSyncStatusState,
  );
}

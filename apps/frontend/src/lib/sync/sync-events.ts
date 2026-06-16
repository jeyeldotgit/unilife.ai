import type { SyncQueueItem } from "@unilife-ai/types";

export const SYNC_PENDING_EVENT = "unilife:sync:pending";
export const SYNC_SUCCESS_EVENT = "unilife:sync:success";
export const SYNC_FAILED_EVENT = "unilife:sync:failed";

export type SyncPendingDetail = { count: number };
export type SyncSuccessDetail = { count: number };
export type SyncFailedDetail = { count: number; items: SyncQueueItem[] };

function emit<T>(name: string, detail: T) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<T>(name, { detail }));
}

export function emitSyncPending(detail: SyncPendingDetail) {
  emit(SYNC_PENDING_EVENT, detail);
}

export function emitSyncSuccess(detail: SyncSuccessDetail) {
  emit(SYNC_SUCCESS_EVENT, detail);
}

export function emitSyncFailed(detail: SyncFailedDetail) {
  emit(SYNC_FAILED_EVENT, detail);
}

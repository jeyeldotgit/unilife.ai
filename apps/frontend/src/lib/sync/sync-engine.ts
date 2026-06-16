import type { SyncItemResult, SyncQueueItem } from "@unilife-ai/types";

import { BrowserBackendApiError, requestBackendClient } from "@/lib/api/client-browser";
import { hydrateAllEntities, markHydrationSuccess } from "@/lib/sync/hydration";
import {
  getPendingQueueItems,
  getQueueSnapshot,
  handleQueueRequestFailure,
  markQueueItemsSyncing,
  reconcileQueueResults,
  releaseQueueItemsPending,
  resetSyncingQueueItems,
} from "@/lib/sync/queue";
import { SYNC_MUTATION_QUEUED_EVENT } from "@/lib/sync/mutation-signal";
import { emitSyncFailed, emitSyncPending, emitSyncSuccess } from "@/lib/sync/sync-events";
import { setSyncStatusState } from "@/lib/sync/sync-status";

type SyncPushResponse = {
  failed: string[];
  synced: string[];
  results?: SyncItemResult[];
};

type WindowLike = Pick<Window, "addEventListener" | "removeEventListener">;

export type SyncEngine = {
  flush: () => Promise<void>;
  start: () => void;
  stop: () => void;
};

type CreateSyncEngineOptions = {
  hydrateAll?: typeof hydrateAllEntities;
  requestPush?: (items: SyncQueueItem[]) => Promise<SyncPushResponse>;
  userId: string;
  windowRef?: WindowLike;
};

async function pushSyncItems(items: SyncQueueItem[]) {
  return requestBackendClient<SyncPushResponse>("/api/sync/push", {
    body: {
      items: items.map((item) => ({
        entity_id: item.entity_id,
        entity_type: item.entity_type,
        id: item.id,
        operation: item.operation,
        payload: item.payload,
      })),
    },
    method: "POST",
  });
}

function hasWindow(value: WindowLike | undefined): value is WindowLike {
  return value !== undefined;
}

export function createSyncEngine(options: CreateSyncEngineOptions): SyncEngine {
  const windowRef = options.windowRef ?? (typeof window !== "undefined" ? window : undefined);
  const hydrateAll = options.hydrateAll ?? hydrateAllEntities;
  const requestPush = options.requestPush ?? pushSyncItems;
  let isStarted = false;
  let isFlushing = false;

  async function syncQueueSnapshot() {
    const snapshot = await getQueueSnapshot(options.userId);
    setSyncStatusState((current) => ({
      ...current,
      failedCount: snapshot.failedCount,
      hasPendingWork: snapshot.hasPendingWork,
      pendingCount: snapshot.pendingCount,
    }));

    return snapshot;
  }

  async function runHydration(forceFull = false) {
    setSyncStatusState((current) => ({
      ...current,
      hydrationPhase: "hydrating",
    }));
    try {
      await hydrateAll({
        forceFull,
        userId: options.userId,
      });
      await markHydrationSuccess(options.userId);
      setSyncStatusState((current) => ({
        ...current,
        hydrationPhase: "hydrated",
      }));
    } catch (error) {
      setSyncStatusState((current) => ({
        ...current,
        hydrationPhase: "failed",
        phase: "failed",
      }));
      throw error;
    }
  }

  async function initialize() {
    const snapshot = await resetSyncingQueueItems(options.userId);
    setSyncStatusState((current) => ({
      ...current,
      failedCount: snapshot.failedCount,
      hasPendingWork: snapshot.hasPendingWork,
      pendingCount: snapshot.pendingCount,
    }));

    try {
      if (typeof navigator === "undefined" || navigator.onLine) {
        if (snapshot.hasPendingWork) {
          await flush();
        } else {
          await runHydration(true);
          await syncQueueSnapshot();
        }
      }
    } catch {
      await syncQueueSnapshot();
    }

    setSyncStatusState((current) => ({
      ...current,
      ready: true,
    }));
  }

  async function flush() {
    if (isFlushing || typeof navigator === "undefined" || !navigator.onLine) {
      return;
    }

    const pendingQueueItems = await getPendingQueueItems(options.userId);

    if (pendingQueueItems.length === 0) {
      await syncQueueSnapshot();
      return;
    }

    isFlushing = true;
    emitSyncPending({ count: pendingQueueItems.length });
    setSyncStatusState((current) => ({
      ...current,
      phase: "syncing",
    }));

    try {
      await markQueueItemsSyncing(pendingQueueItems);
      const response = await requestPush(pendingQueueItems);
      const snapshot = await reconcileQueueResults(
        options.userId,
        pendingQueueItems,
        response,
      );
      await runHydration(response.synced.length > 0);
      if (snapshot.failedCount > 0 || response.failed.length > 0) {
        emitSyncFailed({
          count: snapshot.failedCount || response.failed.length,
          items: pendingQueueItems.filter((item) => response.failed.includes(item.id)),
        });
      } else if (response.synced.length > 0) {
        emitSyncSuccess({ count: response.synced.length });
      }

      setSyncStatusState((current) => ({
        ...current,
        failedCount: snapshot.failedCount,
        hasPendingWork: snapshot.hasPendingWork,
        pendingCount: snapshot.pendingCount,
        lastSyncedAt:
          response.synced.length > 0 ? new Date().toISOString() : current.lastSyncedAt,
        phase:
          snapshot.failedCount > 0
            ? "failed"
            : response.failed.length === 0 && response.synced.length > 0
              ? "synced"
              : "idle",
      }));
    } catch (error) {
      const authOrTransportFailure =
        error instanceof BrowserBackendApiError &&
        (error.code === "UNAUTHENTICATED" || error.status === 401);
      const offlineFailure =
        error instanceof TypeError ||
        (typeof navigator !== "undefined" && !navigator.onLine);
      const snapshot =
        authOrTransportFailure || offlineFailure
          ? await releaseQueueItemsPending(
              options.userId,
              pendingQueueItems,
              authOrTransportFailure
                ? "Sign in again to sync this local change."
                : "Waiting for a stable connection.",
            )
          : await handleQueueRequestFailure(options.userId, pendingQueueItems);
      if (!authOrTransportFailure && !offlineFailure) {
        emitSyncFailed({ count: snapshot.failedCount, items: pendingQueueItems });
      }

      setSyncStatusState((current) => ({
        ...current,
        failedCount: snapshot.failedCount,
        hasPendingWork: snapshot.hasPendingWork,
        pendingCount: snapshot.pendingCount,
        phase: snapshot.failedCount > 0 ? "failed" : "idle",
      }));
    } finally {
      isFlushing = false;
    }
  }

  const handleOnline = () => {
    setSyncStatusState((current) => ({
      ...current,
      isOnline: true,
    }));
    void flush().then(async () => {
      const snapshot = await getQueueSnapshot(options.userId);
      if (!snapshot.hasPendingWork) {
        await runHydration(true);
        await syncQueueSnapshot();
      }
    }).catch(() => null);
  };

  const handleOffline = () => {
    setSyncStatusState((current) => ({
      ...current,
      isOnline: false,
      phase: "idle",
    }));
  };

  const handleMutationQueued = () => {
    setSyncStatusState((current) => ({
      ...current,
      hasPendingWork: true,
      pendingCount: Math.max(1, current.pendingCount + 1),
    }));
    void flush();
  };

  function start() {
    if (isStarted) {
      return;
    }

    isStarted = true;
    setSyncStatusState({
      isOnline: typeof navigator === "undefined" ? true : navigator.onLine,
      hydrationPhase: "idle",
      ready: false,
    });

    if (hasWindow(windowRef)) {
      windowRef.addEventListener("online", handleOnline);
      windowRef.addEventListener("offline", handleOffline);
      windowRef.addEventListener(SYNC_MUTATION_QUEUED_EVENT, handleMutationQueued);
    }

    void initialize();
  }

  function stop() {
    if (!isStarted) {
      return;
    }

    isStarted = false;

    if (hasWindow(windowRef)) {
      windowRef.removeEventListener("online", handleOnline);
      windowRef.removeEventListener("offline", handleOffline);
      windowRef.removeEventListener(SYNC_MUTATION_QUEUED_EVENT, handleMutationQueued);
    }
  }

  return {
    flush,
    start,
    stop,
  };
}

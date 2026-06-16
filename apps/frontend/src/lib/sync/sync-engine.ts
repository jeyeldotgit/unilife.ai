import type { SyncItemResult, SyncQueueItem } from "@unilife-ai/types";

import { requestBackendClient } from "@/lib/api/client-browser";
import { hydrateAllEntities, markHydrationSuccess } from "@/lib/sync/hydration";
import {
  getPendingQueueItems,
  getQueueSnapshot,
  handleQueueRequestFailure,
  markQueueItemsSyncing,
  reconcileQueueResults,
  resetSyncingQueueItems,
} from "@/lib/sync/queue";
import { SYNC_MUTATION_QUEUED_EVENT } from "@/lib/sync/mutation-signal";
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
    }));

    return snapshot;
  }

  async function runHydration(forceFull = false) {
    await hydrateAll({
      forceFull,
      userId: options.userId,
    });
    await markHydrationSuccess(options.userId);
  }

  async function initialize() {
    const snapshot = await resetSyncingQueueItems(options.userId);
    setSyncStatusState((current) => ({
      ...current,
      failedCount: snapshot.failedCount,
      hasPendingWork: snapshot.hasPendingWork,
    }));

    if (typeof navigator === "undefined" || navigator.onLine) {
      if (snapshot.hasPendingWork) {
        await flush();
      } else {
        await runHydration(true);
        await syncQueueSnapshot();
      }
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

      setSyncStatusState((current) => ({
        ...current,
        failedCount: snapshot.failedCount,
        hasPendingWork: snapshot.hasPendingWork,
        lastSyncedAt:
          response.synced.length > 0 ? new Date().toISOString() : current.lastSyncedAt,
        phase:
          snapshot.failedCount > 0
            ? "failed"
            : response.failed.length === 0 && response.synced.length > 0
              ? "synced"
              : "idle",
      }));
    } catch {
      const snapshot = await handleQueueRequestFailure(options.userId, pendingQueueItems);

      setSyncStatusState((current) => ({
        ...current,
        failedCount: snapshot.failedCount,
        hasPendingWork: snapshot.hasPendingWork,
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
        await runHydration();
        await syncQueueSnapshot();
      }
    });
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

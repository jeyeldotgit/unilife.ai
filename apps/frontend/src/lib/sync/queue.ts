import Dexie from "dexie";
import type { SyncItemResult, SyncQueueItem, SyncRecoverySnapshot } from "@unilife-ai/types";

import { db } from "@/lib/db/dexie";
import { SYNC_RETRY_LIMIT } from "@/lib/sync/constants";

async function refreshQueueSnapshot(userId: string) {
  const [pendingCount, failedCount] = await Promise.all([
    db.sync_queue
      .where("[user_id+status+created_at]")
      .between([userId, "pending", Dexie.minKey], [userId, "pending", Dexie.maxKey])
      .count(),
    db.sync_queue.where({ user_id: userId, status: "failed" }).count(),
  ]);

  return {
    failedCount,
    hasPendingWork: pendingCount > 0,
    pendingCount,
  };
}

export async function getPendingQueueItems(userId: string) {
  return db.sync_queue
    .where("[user_id+status+created_at]")
    .between([userId, "pending", Dexie.minKey], [userId, "pending", Dexie.maxKey])
    .toArray();
}

export async function resetSyncingQueueItems(userId: string) {
  const syncingItems = await db.sync_queue
    .where({ user_id: userId, status: "syncing" })
    .toArray();

  if (syncingItems.length === 0) {
    return refreshQueueSnapshot(userId);
  }

  await db.transaction("rw", db.sync_queue, db.sync_recovery, async () => {
    for (const item of syncingItems) {
      await db.sync_queue.update(item.id, { status: "pending" });
    }
  });

  return refreshQueueSnapshot(userId);
}

export async function markQueueItemsSyncing(queueItems: SyncQueueItem[]) {
  const attemptedAt = new Date().toISOString();

  await db.transaction("rw", db.sync_queue, db.sync_recovery, async () => {
    for (const item of queueItems) {
      await db.sync_queue.update(item.id, {
        last_attempted_at: attemptedAt,
        status: "syncing",
      });
    }
  });
}

export function buildFailureQueueUpdate(item: SyncQueueItem, message?: string | null) {
  const retryCount = item.retry_count + 1;

  return {
    last_attempted_at: new Date().toISOString(),
    retry_count: retryCount,
    status: retryCount >= SYNC_RETRY_LIMIT ? "failed" : "pending",
    failure_code: "sync_failed",
    failure_message: message ?? "The server could not apply this change.",
  } as const;
}

export async function reconcileQueueResults(
  userId: string,
  queueItems: SyncQueueItem[],
  result: {
    failed: string[];
    synced: string[];
    results?: SyncItemResult[];
  },
) {
  const failedIds = new Set(result.failed);
  const syncedIds = new Set(result.synced);
  const itemsById = new Map(queueItems.map((item) => [item.id, item] as const));
  const resultsById = new Map((result.results ?? []).map((item) => [item.id, item]));

  await db.transaction("rw", db.sync_queue, db.sync_recovery, async () => {
    for (const syncedId of syncedIds) {
      const itemResult = resultsById.get(syncedId);
      const queueItem = itemsById.get(syncedId);
      await db.sync_queue.update(syncedId, {
        failure_code: null,
        failure_message: null,
        last_attempted_at: new Date().toISOString(),
        status: "synced",
      });
      if (
        itemResult?.status === "replaced" &&
        itemResult.winning_snapshot &&
        queueItem
      ) {
        const recovery: SyncRecoverySnapshot = {
          id: crypto.randomUUID(),
          user_id: userId,
          queue_item_id: queueItem.id,
          entity_type: queueItem.entity_type,
          entity_id: queueItem.entity_id,
          local_payload: queueItem.payload,
          winning_snapshot: itemResult.winning_snapshot,
          replacement_reason:
            itemResult.reason ?? "A newer remote revision replaced this local change.",
          created_at: new Date().toISOString(),
          restored_at: null,
        };
        await db.sync_recovery.put(recovery);
      }
    }

    for (const failedId of failedIds) {
      const item = itemsById.get(failedId);
      if (!item) {
        continue;
      }

      await db.sync_queue.update(
        failedId,
        buildFailureQueueUpdate(item, resultsById.get(failedId)?.reason),
      );
    }
  });

  return refreshQueueSnapshot(userId);
}

export async function retryFailedQueueItem(userId: string, queueItemId: string) {
  const item = await db.sync_queue.get(queueItemId);
  if (!item || item.user_id !== userId || item.status !== "failed") return false;

  await db.sync_queue.update(queueItemId, {
    failure_code: null,
    failure_message: null,
    retry_count: 0,
    status: "pending",
  });
  return true;
}

export async function handleQueueRequestFailure(
  userId: string,
  queueItems: SyncQueueItem[],
) {
  await db.transaction("rw", db.sync_queue, async () => {
    for (const item of queueItems) {
      await db.sync_queue.update(item.id, buildFailureQueueUpdate(item));
    }
  });

  return refreshQueueSnapshot(userId);
}

export async function releaseQueueItemsPending(
  userId: string,
  queueItems: SyncQueueItem[],
  message?: string,
) {
  await db.transaction("rw", db.sync_queue, async () => {
    for (const item of queueItems) {
      await db.sync_queue.update(item.id, {
        failure_code: message ? "sync_deferred" : null,
        failure_message: message ?? null,
        status: "pending",
      });
    }
  });

  return refreshQueueSnapshot(userId);
}

export async function getQueueSnapshot(userId: string) {
  return refreshQueueSnapshot(userId);
}

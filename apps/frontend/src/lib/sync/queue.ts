import Dexie from "dexie";
import type { SyncQueueItem } from "@unilife-ai/types";

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

  await db.transaction("rw", db.sync_queue, async () => {
    for (const item of syncingItems) {
      await db.sync_queue.update(item.id, { status: "pending" });
    }
  });

  return refreshQueueSnapshot(userId);
}

export async function markQueueItemsSyncing(queueItems: SyncQueueItem[]) {
  const attemptedAt = new Date().toISOString();

  await db.transaction("rw", db.sync_queue, async () => {
    for (const item of queueItems) {
      await db.sync_queue.update(item.id, {
        last_attempted_at: attemptedAt,
        status: "syncing",
      });
    }
  });
}

export function buildFailureQueueUpdate(item: SyncQueueItem) {
  const retryCount = item.retry_count + 1;

  return {
    last_attempted_at: new Date().toISOString(),
    retry_count: retryCount,
    status: retryCount >= SYNC_RETRY_LIMIT ? "failed" : "pending",
  } as const;
}

export async function reconcileQueueResults(
  userId: string,
  queueItems: SyncQueueItem[],
  result: {
    failed: string[];
    synced: string[];
  },
) {
  const failedIds = new Set(result.failed);
  const syncedIds = new Set(result.synced);
  const itemsById = new Map(queueItems.map((item) => [item.id, item] as const));

  await db.transaction("rw", db.sync_queue, async () => {
    for (const syncedId of syncedIds) {
      await db.sync_queue.update(syncedId, {
        last_attempted_at: new Date().toISOString(),
        status: "synced",
      });
    }

    for (const failedId of failedIds) {
      const item = itemsById.get(failedId);
      if (!item) {
        continue;
      }

      await db.sync_queue.update(failedId, buildFailureQueueUpdate(item));
    }
  });

  return refreshQueueSnapshot(userId);
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

export async function getQueueSnapshot(userId: string) {
  return refreshQueueSnapshot(userId);
}

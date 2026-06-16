import type { SyncRecoverySnapshot } from "@unilife-ai/types";

import { createQueueItem } from "@/lib/mutations/local-data";
import { db } from "@/lib/db/dexie";
import { notifySyncMutationQueued } from "@/lib/sync/mutation-signal";

export async function restoreRecoverySnapshot(snapshot: SyncRecoverySnapshot) {
  const timestamp = new Date().toISOString();
  const payload = { ...snapshot.local_payload, updated_at: timestamp };
  const tableByEntity = {
    assignment: "assignments",
    budget: "budgets",
    class: "classes",
    exam: "exams",
    expense: "expenses",
  } as const;
  const tableName = tableByEntity[snapshot.entity_type as keyof typeof tableByEntity];
  if (tableName) {
    const table = db.table(tableName);
    const current = await table.get(snapshot.entity_id);
    if (current) await table.put({ ...current, ...payload, id: snapshot.entity_id });
  }
  const queueItem = createQueueItem({
    entityId: snapshot.entity_id,
    entityType: snapshot.entity_type,
    intent: "update",
    operation: "update",
    payload,
    userId: snapshot.user_id,
  });

  await db.transaction("rw", db.sync_queue, db.sync_recovery, async () => {
    await db.sync_queue.put(queueItem);
    await db.sync_recovery.update(snapshot.id, { restored_at: timestamp });
  });
  notifySyncMutationQueued();
  return queueItem;
}

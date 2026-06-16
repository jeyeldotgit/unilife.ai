"use client";

import { db } from "@/lib/db/dexie";
import { useLiveQueryValue } from "@/hooks/use-live-query";
import { notifySyncMutationQueued } from "@/lib/sync/mutation-signal";
import { retryFailedQueueItem } from "@/lib/sync/queue";
import { restoreRecoverySnapshot } from "@/lib/sync/recovery";

export function SyncRecoveryPanel({ userId }: { userId: string }) {
  const queue = useLiveQueryValue(
    () => db.sync_queue.where("user_id").equals(userId).reverse().sortBy("created_at"),
    [],
    [userId],
  );
  const recoveries = useLiveQueryValue(
    () => db.sync_recovery.where("user_id").equals(userId).reverse().sortBy("created_at"),
    [],
    [userId],
  );

  return (
    <section id="sync-recovery" className="scroll-mt-24 rounded-3xl border border-[#c2c6d6]/40 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold">Sync &amp; recovery</h2>
      <p className="mt-1 text-sm text-[#424754]">Review local changes, retry failures, and restore revisions replaced by newer remote work.</p>
      <div className="mt-5 space-y-3">
        {queue.value.slice(0, 12).map((item) => (
          <article className="rounded-2xl bg-[#f3f4f5] p-4 text-sm" key={item.id}>
            <div className="flex items-center justify-between gap-3"><strong>{item.entity_type} {item.operation}</strong><span className="rounded-full bg-white px-2 py-1 font-semibold">{item.status}</span></div>
            {item.failure_message ? <p className="mt-2 text-[#ba1a1a]">{item.failure_message}</p> : null}
            {item.status === "failed" ? <button className="mt-3 rounded-full border border-[#0058be] px-3 py-2 font-semibold text-[#0058be]" type="button" onClick={() => void retryFailedQueueItem(userId, item.id).then((retried) => { if (retried) notifySyncMutationQueued(); })}>Retry</button> : null}
          </article>
        ))}
        {queue.loaded && queue.value.length === 0 ? <p className="text-sm text-[#424754]">No local sync operations yet.</p> : null}
      </div>
      {recoveries.value.length > 0 ? <h3 className="mt-6 font-semibold">Replaced revisions</h3> : null}
      <div className="mt-3 space-y-3">
        {recoveries.value.map((snapshot) => (
          <article className="rounded-2xl border border-[#ffd8a8] bg-[#fff8ed] p-4 text-sm" key={snapshot.id}>
            <strong>{snapshot.entity_type} revision replaced</strong>
            <p className="mt-1 text-[#424754]">{snapshot.replacement_reason}</p>
            <details className="mt-2"><summary className="cursor-pointer font-semibold">Review local snapshot</summary><pre className="mt-2 overflow-auto whitespace-pre-wrap text-xs">{JSON.stringify(snapshot.local_payload, null, 2)}</pre></details>
            <button disabled={snapshot.restored_at !== null} className="mt-3 rounded-full bg-[#0058be] px-3 py-2 font-semibold text-white disabled:opacity-50" type="button" onClick={() => void restoreRecoverySnapshot(snapshot)}>{snapshot.restored_at ? "Restore queued" : "Restore as new change"}</button>
          </article>
        ))}
      </div>
    </section>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { useCurrentUserId } from "@/hooks/use-current-user-id";
import { useLiveQueryValue } from "@/hooks/use-live-query";
import { db } from "@/lib/db/dexie";
import { getNotificationPermission, requestNotificationPermission } from "@/lib/notifications/runtime";
import { notifySyncMutationQueued } from "@/lib/sync/mutation-signal";
import { retryFailedQueueItem } from "@/lib/sync/queue";
import { Icon } from "@/components/ui/Icon";

export function NotificationDrawer({
  className = "rounded-full p-2 text-[#424754] transition-opacity hover:opacity-80",
}: {
  className?: string;
}) {
  const userId = useCurrentUserId();
  const [open, setOpen] = useState(false);
  const [permission, setPermission] = useState(() => getNotificationPermission());
  const [lastOpenedAt, setLastOpenedAt] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem("unilife:bell-opened-at");
  });
  const notifications = useLiveQueryValue(
    async () => {
      if (!userId) return [];
      return db.notifications
        .where("user_id")
        .equals(userId)
        .reverse()
        .sortBy("created_at");
    },
    [],
    [userId],
  );
  const failedQueue = useLiveQueryValue(
    async () => {
      if (!userId) return [];
      return db.sync_queue
        .where("user_id")
        .equals(userId)
        .and((item) => item.status === "failed")
        .reverse()
        .sortBy("created_at");
    },
    [],
    [userId],
  );
  const aiActions = useLiveQueryValue(
    async () => {
      if (!userId) return [];
      const cutoff = Date.now() - 24 * 60 * 60 * 1000;
      return db.ai_actions
        .where("user_id")
        .equals(userId)
        .and((item) => Date.parse(item.created_at) >= cutoff)
        .reverse()
        .sortBy("created_at");
    },
    [],
    [userId],
  );
  const bellItems = useLiveQueryValue(
    async () => {
      if (!userId) return [];
      const now = new Date().toISOString();
      return db.bell_items
        .where("user_id")
        .equals(userId)
        .and((item) => item.kind === "ai_result" && (!item.expires_at || item.expires_at > now))
        .reverse()
        .sortBy("created_at");
    },
    [],
    [userId],
  );
  const unread = useMemo(() => {
    if (!lastOpenedAt) {
      return notifications.value.length + failedQueue.value.length + aiActions.value.length + bellItems.value.length;
    }

    return (
      notifications.value.filter((item) => item.created_at > lastOpenedAt).length +
      failedQueue.value.filter((item) => item.created_at > lastOpenedAt).length +
      aiActions.value.filter((item) => item.created_at > lastOpenedAt).length +
      bellItems.value.filter((item) => item.created_at > lastOpenedAt).length
    );
  }, [aiActions.value, bellItems.value, failedQueue.value, lastOpenedAt, notifications.value]);

  const openDrawer = () => {
    const timestamp = new Date().toISOString();
    setOpen(true);
    setLastOpenedAt(timestamp);
    window.localStorage.setItem("unilife:bell-opened-at", timestamp);
  };

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <button aria-label="Open notifications" className={`relative ${className}`} onClick={openDrawer} type="button">
        <Icon name="notifications" />
        {unread > 0 ? <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-[#ba1a1a]" /> : null}
      </button>
      {open ? (
        <div className="fixed inset-0 z-[70] bg-[#191c1d]/35 md:flex md:items-start md:justify-end">
          <button aria-label="Close notifications" className="absolute inset-0" onClick={() => setOpen(false)} type="button" />
          <aside className="absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto rounded-t-[24px] bg-white p-5 shadow-2xl md:inset-x-auto md:bottom-auto md:right-4 md:top-16 md:w-[380px] md:rounded-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">Notifications</h2>
              <button className="rounded-full p-2 text-[#424754]" onClick={() => setOpen(false)} type="button">
                <Icon name="close" />
              </button>
            </div>
            {permission !== "granted" ? (
              <section className="mb-4 rounded-xl border border-[#d8e2ff] bg-[#f8fbff] p-3 text-sm">
                <p className="font-semibold">Enable notifications to receive reminders</p>
                <p className="mt-1 text-[#424754]">Sync alerts and AI results still appear here.</p>
                {permission === "default" ? (
                  <button
                    className="mt-3 rounded-full bg-[#0058be] px-3 py-2 text-xs font-semibold text-white"
                    onClick={() => void requestNotificationPermission().then(setPermission)}
                    type="button"
                  >
                    Enable
                  </button>
                ) : null}
              </section>
            ) : null}
            <section className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-[#424754]">Reminders</h3>
              {notifications.value.slice(0, 5).map((item) => (
                <article className="rounded-xl bg-[#f3f4f5] p-3 text-sm" key={item.id}>
                  <p className="font-semibold">{item.title}</p>
                  <p className="mt-1 text-[#424754]">{item.body}</p>
                </article>
              ))}
              {notifications.loaded && notifications.value.length === 0 ? <p className="text-sm text-[#424754]">No reminders yet.</p> : null}
            </section>
            <section className="mt-5 space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-[#424754]">Sync failures</h3>
              {failedQueue.value.map((item) => (
                <article className="rounded-xl border border-[#ffdad6] bg-[#fff8f7] p-3 text-sm" key={item.id}>
                  <p className="font-semibold">{item.entity_type} {item.operation} could not save</p>
                  {item.failure_message ? <p className="mt-1 text-[#ba1a1a]">{item.failure_message}</p> : null}
                  <button className="mt-2 rounded-full border border-[#0058be] px-3 py-1.5 text-xs font-semibold text-[#0058be]" onClick={() => void retryFailedQueueItem(userId!, item.id).then((retried) => { if (retried) notifySyncMutationQueued(); })} type="button">
                    Retry
                  </button>
                </article>
              ))}
              {failedQueue.loaded && failedQueue.value.length === 0 ? <p className="text-sm text-[#424754]">No failed sync items.</p> : null}
            </section>
            <section className="mt-5 space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-[#424754]">AI action results</h3>
              {bellItems.value.map((item) => (
                <article className="rounded-xl bg-[#f3f4f5] p-3 text-sm" key={item.id}>
                  <p className="font-semibold">{item.title}</p>
                  <p className="mt-1 text-[#424754]">{item.body}</p>
                </article>
              ))}
              {aiActions.value.slice(0, 5).map((item) => (
                <article className="rounded-xl bg-[#f3f4f5] p-3 text-sm" key={item.id}>
                  <p className="font-semibold">AI action {item.status.replaceAll("_", " ")}</p>
                  <p className="mt-1 text-[#424754]">{item.proposal.operations.map((operation) => `${operation.operation} ${operation.entity_type}`).join(", ")}</p>
                </article>
              ))}
              {aiActions.loaded && bellItems.loaded && aiActions.value.length === 0 && bellItems.value.length === 0 ? <p className="text-sm text-[#424754]">No recent AI results.</p> : null}
            </section>
          </aside>
        </div>
      ) : null}
    </>
  );
}

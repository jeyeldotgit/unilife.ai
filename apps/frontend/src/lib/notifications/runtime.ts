"use client";

import type { Notification as NotificationRecord } from "@unilife-ai/types";
import { liveQuery } from "dexie";

import { db } from "@/lib/db/dexie";
import { buildNotificationDeepLink } from "@/lib/notifications/deep-links";
import { reconcileAllNotifications } from "@/lib/notifications/store";
import {
  getCachedNotificationSettings,
  getCategoryPreference,
} from "@/lib/notifications/preferences";
import { getTime24InTimeZone } from "@/lib/profile/time";

const MAX_TIMEOUT_MS = 2_147_000_000;
const QUIET_HOURS_RECHECK_MS = 60 * 1000;

export type NotificationPermissionState =
  | NotificationPermission
  | "unsupported";

export function getNotificationPermission(): NotificationPermissionState {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }

  return Notification.permission;
}

export async function requestNotificationPermission() {
  if (getNotificationPermission() === "unsupported") {
    return "unsupported" as const;
  }

  return Notification.requestPermission();
}

export async function registerNotificationServiceWorker() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }

  return navigator.serviceWorker.register("/sw.js", { scope: "/" });
}

export async function showLocalNotification(record: NotificationRecord) {
  if (getNotificationPermission() !== "granted") {
    return false;
  }

  const registration = await registerNotificationServiceWorker();
  if (!registration) {
    return false;
  }

  await registration.showNotification(record.title, {
    body: record.body,
    data: {
      url: buildNotificationDeepLink({
        entityId: record.entity_id,
        entityType: record.entity_type,
        notificationId: record.id,
      }),
    },
    icon: "/unilife-ai.svg",
    tag: record.id,
  });
  await db.notifications.update(record.id, { status: "sent" });
  return true;
}

export async function dismissNotification(notificationId: string) {
  const notification = await db.notifications.get(notificationId);
  if (notification && notification.status !== "dismissed") {
    await db.notifications.update(notificationId, { status: "dismissed" });
  }
}

export function isWithinQuietHours(
  time: string,
  start: string,
  end: string,
) {
  if (start === end) return true;
  if (start < end) return time >= start && time < end;
  return time >= start || time < end;
}

export function createReminderRuntime(userId: string) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let subscription: { unsubscribe: () => void } | null = null;
  let running = false;
  let reconciling = false;

  function clearTimer() {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  }

  async function deliverDue() {
    if (!running || getNotificationPermission() !== "granted") {
      return;
    }

    const currentDate = new Date();
    const now = currentDate.toISOString();
    const settings = await getCachedNotificationSettings(userId);
    const localTime = getTime24InTimeZone(settings.timezone, currentDate);
    const due = await db.notifications
      .where("user_id")
      .equals(userId)
      .and(
        (notification) =>
          notification.status === "pending" && notification.scheduled_at <= now,
      )
      .sortBy("scheduled_at");

    for (const notification of due) {
      const preference = getCategoryPreference(
        settings,
        notification.category ?? notification.entity_type,
      );
      if (!preference.enabled) {
        await db.notifications.delete(notification.id);
        continue;
      }
      if (
        settings.quiet_hours_enabled &&
        !preference.urgent_bypass_enabled &&
        isWithinQuietHours(
          localTime,
          settings.quiet_hours_start,
          settings.quiet_hours_end,
        )
      ) {
        continue;
      }
      await showLocalNotification(notification);
    }
  }

  async function armNext() {
    clearTimer();
    if (!running || getNotificationPermission() !== "granted") {
      return;
    }

    await deliverDue();
    const pending = await db.notifications
      .where("user_id")
      .equals(userId)
      .and((notification) => notification.status === "pending")
      .sortBy("scheduled_at");
    const next = pending[0];

    if (!next) {
      return;
    }

    const settings = await getCachedNotificationSettings(userId);
    const quiet =
      settings.quiet_hours_enabled &&
      isWithinQuietHours(
        getTime24InTimeZone(settings.timezone),
        settings.quiet_hours_start,
        settings.quiet_hours_end,
      );
    const delay = Math.min(
      MAX_TIMEOUT_MS,
      Math.max(
        quiet ? QUIET_HOURS_RECHECK_MS : 0,
        new Date(next.scheduled_at).getTime() - Date.now(),
      ),
    );
    timer = setTimeout(() => void armNext(), delay);
  }

  async function reconcile() {
    if (!running || reconciling) {
      return;
    }

    reconciling = true;
    try {
      await reconcileAllNotifications(userId);
      await armNext();
    } finally {
      reconciling = false;
    }
  }

  const handleResume = () => {
    if (typeof document === "undefined" || document.visibilityState === "visible") {
      void reconcile();
    }
  };

  function start() {
    if (running) {
      return;
    }

    running = true;
    void registerNotificationServiceWorker();
    subscription = liveQuery(() =>
      Promise.all([
        db.classes.where("user_id").equals(userId).toArray(),
        db.assignments.where("user_id").equals(userId).toArray(),
        db.exams.where("user_id").equals(userId).toArray(),
        db.budgets.where("user_id").equals(userId).toArray(),
        db.expenses.where("user_id").equals(userId).toArray(),
        db.notification_settings.where("user_id").equals(userId).toArray(),
      ]),
    ).subscribe(() => void reconcile());
    window.addEventListener("focus", handleResume);
    window.addEventListener("unilife:notification-permission", handleResume);
    document.addEventListener("visibilitychange", handleResume);
    void reconcile();
  }

  function stop() {
    running = false;
    clearTimer();
    subscription?.unsubscribe();
    subscription = null;
    window.removeEventListener("focus", handleResume);
    window.removeEventListener("unilife:notification-permission", handleResume);
    document.removeEventListener("visibilitychange", handleResume);
  }

  return { reconcile, start, stop };
}

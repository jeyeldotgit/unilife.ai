"use client";

import { useEffect, useRef, useState } from "react";

import { Icon } from "@/components/ui/Icon";
import { RecoverableError } from "@/components/ui/RecoverableError";
import {
  getNotificationPermission,
  requestNotificationPermission,
  type NotificationPermissionState,
} from "@/lib/notifications/runtime";

function statusCopy(status: NotificationPermissionState) {
  if (status === "granted") {
    return "Local reminders are enabled on this device.";
  }
  if (status === "denied") {
    return "Notifications are blocked. Enable them in your browser settings to receive reminders.";
  }
  if (status === "unsupported") {
    return "This browser does not support local notifications. Your reminder schedule is still saved.";
  }
  return "Enable local notifications to receive class, assignment, and exam reminders.";
}

export function NotificationPermissionButton({
  className = "rounded-full p-2 text-[#3B82F6] transition-opacity hover:opacity-80",
}: {
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<NotificationPermissionState>("default");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const openSettings = () => {
    setStatus(getNotificationPermission());
    setError(null);
    setOpen(true);
  };

  const enable = async () => {
    setPending(true);
    setError(null);

    try {
      const nextStatus = await requestNotificationPermission();
      setStatus(nextStatus);
      window.dispatchEvent(new Event("unilife:notification-permission"));
    } catch {
      setError("We couldn't update notification permissions right now.");
    } finally {
      setPending(false);
    }
  };

  useEffect(() => {
    if (!open) {
      triggerRef.current?.focus();
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !pending) {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, pending]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label="Notification settings"
        className={className}
        onClick={openSettings}
      >
        <Icon name={status === "granted" ? "notifications_active" : "notifications"} />
      </button>

      {open ? (
        <div className="fixed inset-0 z-[70] flex items-end bg-[#191c1d]/35">
          <button
            type="button"
            aria-label="Close notification settings"
            className="absolute inset-0"
            onClick={() => setOpen(false)}
          />
          <div className="relative z-10 w-full rounded-t-[28px] bg-white px-5 pb-8 pt-3 shadow-2xl">
            <div className="mx-auto h-1.5 w-14 rounded-full bg-[#c2c6d6]" />
            <div className="mt-5 flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#d8e2ff] text-[#0058be]">
                <Icon
                  name={status === "granted" ? "notifications_active" : "notifications"}
                  filled={status === "granted"}
                />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-xl font-bold text-[#191c1d]">
                  Local reminders
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#424754]">
                  {statusCopy(status)}
                </p>
                {error ? (
                  <RecoverableError
                    className="mt-4"
                    title="Notification settings failed"
                    message={error}
                  />
                ) : null}
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                className="flex-1 rounded-xl border border-[#c2c6d6] px-4 py-3 text-sm font-semibold"
                onClick={() => setOpen(false)}
              >
                Close
              </button>
              {status === "default" ? (
                <button
                  type="button"
                  disabled={pending}
                  className="flex-1 rounded-xl bg-[#0058be] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
                  onClick={() => void enable()}
                >
                  {pending ? "Enabling..." : "Enable"}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

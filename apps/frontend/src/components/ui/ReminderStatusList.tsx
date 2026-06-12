import { Icon } from "@/components/ui/Icon";
import type { ReminderStatusItem } from "@/lib/types";

export function ReminderStatusList({
  reminders = [],
}: {
  reminders?: ReminderStatusItem[];
}) {
  return (
    <div className="mt-6">
      <h3 className="text-sm font-semibold text-[#424754]">Reminders</h3>
      {reminders.length > 0 ? (
        <div className="mt-3 space-y-2">
          {reminders.map((reminder) => (
            <div
              key={reminder.id}
              className="flex items-center gap-3 rounded-xl bg-[#f8f9fa] px-4 py-3"
            >
              <Icon
                name={
                  reminder.status === "pending"
                    ? "notifications"
                    : reminder.status === "sent"
                      ? "check_circle"
                      : "done_all"
                }
                className={
                  reminder.status === "pending"
                    ? "text-[#0058be]"
                    : "text-[#00714d]"
                }
                filled={reminder.status !== "pending"}
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold capitalize text-[#191c1d]">
                  {reminder.label}
                </p>
                <p className="text-xs text-[#424754]">
                  {reminder.scheduledLabel}
                </p>
              </div>
              <span className="text-xs font-semibold capitalize text-[#424754]">
                {reminder.status}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-[#6B7280]">No active reminders.</p>
      )}
    </div>
  );
}

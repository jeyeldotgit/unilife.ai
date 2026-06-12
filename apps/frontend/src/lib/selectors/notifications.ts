import type { Notification } from "@unilife-ai/types";

import { formatMonthDayTime } from "@/lib/api/utils";
import type { ReminderStatusItem } from "@/lib/types";

export function buildReminderStatusItems(notifications: Notification[]) {
  return notifications
    .slice()
    .sort((left, right) => left.scheduled_at.localeCompare(right.scheduled_at))
    .map(
      (notification) =>
        ({
          id: notification.id,
          label: notification.title.replace(/ reminder$/i, ""),
          scheduledFor: notification.scheduled_at,
          scheduledLabel: formatMonthDayTime(notification.scheduled_at),
          status: notification.status,
        }) satisfies ReminderStatusItem,
    );
}


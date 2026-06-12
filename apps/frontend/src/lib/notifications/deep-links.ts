import type { NotificationEntityType } from "@unilife-ai/types";

const ROUTES: Record<NotificationEntityType, string> = {
  assignment: "/assignments",
  class: "/schedule",
  exam: "/exams",
};

export function buildNotificationDeepLink(input: {
  entityId: string;
  entityType: NotificationEntityType;
  notificationId: string;
}) {
  const params = new URLSearchParams({
    item: input.entityId,
    notification: input.notificationId,
  });

  return `${ROUTES[input.entityType]}?${params.toString()}`;
}

export function parseNotificationDeepLink(search: string) {
  const params = new URLSearchParams(search);

  return {
    itemId: params.get("item"),
    notificationId: params.get("notification"),
  };
}


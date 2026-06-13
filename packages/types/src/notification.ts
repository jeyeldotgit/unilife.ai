export type NotificationEntityType = "class" | "assignment" | "exam";

export type NotificationStatus = "pending" | "sent" | "dismissed";

export type Notification = {
  id: string;
  user_id: string;
  occurrence_id?: string | null;
  entity_type: NotificationEntityType;
  entity_id: string;
  title: string;
  body: string;
  scheduled_at: string; // ISO 8601
  status: NotificationStatus;
  created_at: string;
};

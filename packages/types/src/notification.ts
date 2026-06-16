export type NotificationCategory =
  | "class"
  | "assignment"
  | "exam"
  | "budget_alert"
  | "daily_briefing";

export type NotificationEntityType = NotificationCategory;

export type NotificationStatus = "pending" | "sent" | "dismissed";

export type NotificationPreference = {
  category?: NotificationCategory;
  enabled: boolean;
  urgent_bypass_enabled: boolean;
  escalation_limit: number;
};

export type NotificationSettings = {
  user_id: string;
  timezone: string;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  preferences: NotificationPreference[];
  updated_at: string;
};

export type Notification = {
  id: string;
  user_id: string;
  occurrence_id?: string | null;
  entity_type: NotificationEntityType;
  category: NotificationCategory;
  entity_id: string;
  logical_item_id?: string;
  title: string;
  body: string;
  scheduled_at: string; // ISO 8601
  status: NotificationStatus;
  created_at: string;
};

export type BellItemKind = "reminder" | "sync_failure" | "ai_result";

export type BellItem = {
  id: string;
  user_id: string;
  kind: BellItemKind;
  title: string;
  body: string;
  entity_type?: string | null;
  entity_id?: string | null;
  retry_queue_item_id?: string | null;
  read_at: string | null;
  expires_at: string | null;
  created_at: string;
};

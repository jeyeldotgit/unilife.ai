export type SyncOperation = "create" | "update" | "delete";

export type SyncEntityType =
  | "class"
  | "assignment"
  | "exam"
  | "expense"
  | "budget";

export type SyncStatus = "pending" | "syncing" | "synced" | "failed";

export type SyncQueueMutationMeta = {
  client_mutation_id: string;
  logical_operation_id: string;
  intent: "create" | "update" | "delete" | "delete_restore";
  acknowledged_at: string | null;
  supersedes_queue_item_id: string | null;
};

export type SyncQueueItem = {
  id: string; // local UUID
  user_id: string;
  entity_type: SyncEntityType;
  entity_id: string;
  operation: SyncOperation;
  payload: Record<string, unknown>;
  status: SyncStatus;
  retry_count: number;
  created_at: string;
  last_attempted_at: string | null;
  mutation_meta?: SyncQueueMutationMeta;
};

import type {
  RecurrenceException,
  RecurrenceOccurrence,
  RecurrenceSeries,
} from "./recurrence";

export type SyncOperation = "create" | "update" | "delete";

export type SyncEntityType =
  | "academic_term"
  | "class"
  | "assignment"
  | "exam"
  | "expense"
  | "budget"
  | "recurrence_series"
  | "recurrence_occurrence"
  | "recurrence_exception"
  | "ai_action";

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
  failure_code?: string | null;
  failure_message?: string | null;
  mutation_meta?: SyncQueueMutationMeta;
};

export type SyncItemResult = {
  id: string;
  status: "synced" | "replaced" | "failed";
  reason: string | null;
  winning_snapshot: Record<string, unknown> | null;
};

export type SyncRecoverySnapshot = {
  id: string;
  user_id: string;
  queue_item_id: string;
  entity_type: SyncEntityType;
  entity_id: string;
  local_payload: Record<string, unknown>;
  winning_snapshot: Record<string, unknown>;
  replacement_reason: string;
  created_at: string;
  restored_at: string | null;
};

export type SyncHydrationRecord =
  | import("./academic-term").AcademicTerm
  | import("./ai-action").AiActionHistory
  | import("./budget").BudgetRevision
  | RecurrenceException
  | RecurrenceOccurrence
  | RecurrenceSeries;

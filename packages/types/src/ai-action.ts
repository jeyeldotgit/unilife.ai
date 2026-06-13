import type { SyncEntityType } from "./sync-queue";

export type AiProposalStatus =
  | "proposed"
  | "partially_approved"
  | "approved"
  | "rejected"
  | "applied"
  | "failed"
  | "undone";

export type AiOperationStatus =
  | "proposed"
  | "approved"
  | "rejected"
  | "applied"
  | "failed"
  | "undone";

export type AiProposedOperation = {
  id: string;
  operation: "create" | "update" | "delete";
  entity_type: Exclude<SyncEntityType, "ai_action">;
  entity_id: string | null;
  before: Record<string, unknown> | null;
  proposed: Record<string, unknown>;
  uncertain_fields: string[];
  confidence: number | null;
  status: AiOperationStatus;
  approved_payload: Record<string, unknown> | null;
  applied_revision: string | null;
  error: string | null;
};

export type AiProposal = {
  id: string;
  processing_layer: "local" | "gemini";
  status: AiProposalStatus;
  operations: AiProposedOperation[];
  created_at: string;
  updated_at: string;
};

export type AiActionHistory = {
  id: string;
  user_id: string;
  proposal: AiProposal;
  status: AiProposalStatus;
  processing_layer: "local" | "gemini";
  created_at: string;
  updated_at: string;
};

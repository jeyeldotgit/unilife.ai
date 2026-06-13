# P5-S04 AI Action Review History and Undo

## I. Meta Specifications

**Spec Name:** P5-S04-ai-action-review-history-and-undo  
**Phase:** Phase 5  
**Responsibility:** Ensure every AI-proposed domain write is reviewed before persistence and provide a visible, auditable history with undo that cannot overwrite later user work.

## II. System Dependencies & Architectural Context

**Upstream Dependencies:**
- `P5-S02` mutation safety, duplicate warnings, and recoverable errors.
- `P5-S03` recurrence and conflict contracts.
- `P2-S05` stateless AI chat endpoint and AI logging.
- `P4-S04` local parser and offline chat execution.
- `P4-S03` Dexie and sync queue.

**Downstream Dependents:**
- `P5-F01` imported schedule review and confirmation.

**Inputs (Reference Materials):**
- `apps/backend/src/services/ai.service.ts`
- `packages/database/src/schema/ai_logs.ts`
- `apps/frontend/src/lib/api/chat.ts`
- `apps/frontend/src/lib/chat/*`
- `apps/frontend/src/components/chat/*`
- `docs/core/ENDPOINT_REF.md`

**Resolved Gaps:**
- No confidence threshold may auto-save an AI-proposed write.
- The backend AI endpoint remains stateless with respect to domain CRUD.
- Multi-action proposals are reviewed individually.
- Undo is permitted only when the affected record has not changed since the AI action.

## III. Scope Boundaries

### A. In-Scope Elements

- AI proposal and operation contracts for create, update, and delete.
- Required confirmation for all AI-originated writes, online and offline.
- Proposal preview, editable uncertain fields, and individual operation approval/rejection.
- Duplicate and conflict warnings before approval.
- AI action lifecycle history and affected-record links.
- Guarded undo for applied AI actions.
- Failure and partial-approval behavior for multi-action proposals.

### B. Out-of-Scope Elements

- Direct domain writes from the AI backend endpoint.
- Automatic approval based on confidence.
- Undo that overwrites later manual or synchronized edits.
- Long-form AI conversation history redesign.
- Schedule file parsing, owned by `P5-F01`.

## IV. Technical Delivery Requirements

### A. Artifacts & Deliverables to Produce

- Shared AI proposal, operation, uncertainty, status, and history contracts.
- AI endpoint response updates and validation.
- Proposal review UI for single and multi-operation responses.
- Persistent AI action-history records and user-scoped read access.
- Guarded undo service/action that validates record revision before restoring state.
- Updates to online and local parser execution so neither path auto-saves AI writes.

### B. Proposal Contract

AI write responses must expose a stable proposal ID and one or more operations:

```ts
type AiProposalStatus =
  | "proposed"
  | "partially_approved"
  | "approved"
  | "rejected"
  | "applied"
  | "failed"
  | "undone";

type AiProposedOperation = {
  id: string;
  operation: "create" | "update" | "delete";
  entity_type: SyncEntityType;
  entity_id: string | null;
  before: Record<string, unknown> | null;
  proposed: Record<string, unknown>;
  uncertain_fields: string[];
  confidence: number | null;
};
```

The endpoint may return explanatory text without a proposal for read-only intents. Every response containing a write operation must require confirmation.

### C. Review And Apply Rules

- Show every proposed field before persistence and visibly mark uncertain fields.
- Users may edit proposals before approval.
- Multi-operation proposals support individual approve/reject choices.
- Run domain validation, duplicate detection, recurrence validation, and conflict detection on the final edited proposal.
- Approved operations write through existing local mutation helpers and enqueue through the existing sync path.
- Rejected operations never write domain data.
- Partial failures preserve successful operation results and expose retryable failed operations without replaying successful ones.

### D. History And Undo Rules

- History records proposal status, timestamps, processing layer, affected entity IDs, approved payload, pre-action snapshot, applied revision, and failure details.
- History is user-scoped and available from chat or an equivalent settings/history surface.
- Undo validates that each affected record still matches the revision produced by the AI action.
- If a record has later edits, automated undo is disabled and the history surface shows the previous snapshot for manual review.
- Valid undo uses the standard mutation and sync paths and records the resulting `undone` state.

## V. Validation & Exit Criteria

- No online or offline AI write modifies domain data before explicit confirmation.
- High-confidence actions are previewed exactly like low-confidence actions.
- Users can edit uncertain fields and approve or reject operations individually.
- Duplicate and schedule-conflict warnings appear before applying relevant operations.
- Applied operations appear in user-visible history with affected-record links.
- Undo succeeds only when no later record edit exists.
- Undo never overwrites later user or synchronized changes.
- Partial failures do not replay already applied operations.
- The AI backend remains free of direct domain CRUD writes.
- Frontend lint passes: `pnpm --filter @unilife-ai/frontend lint`.
- Monorepo development starts successfully: `pnpm dev`.
- Monorepo tests pass: `pnpm test`.

## VI. Required Tests

- Endpoint/schema tests proving all write proposals require confirmation.
- Regression tests proving high-confidence and local-parser writes no longer auto-save.
- Review UI tests for edit, individual approve/reject, duplicate warning, conflict warning, and cancellation.
- Multi-operation integration tests for full approval, partial approval, partial failure, and retry.
- History tests for each lifecycle status and user scoping.
- Undo tests for unchanged records, later manual edits, later sync edits, deleted records, and partial proposals.
- Repository-spy tests proving the AI endpoint does not call domain repositories.
- Frontend and backend build, lint, and test checks.

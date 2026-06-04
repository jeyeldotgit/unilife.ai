# P2-S04 Offline Sync Push and Conflict Resolution

## I. Meta Specifications

**Spec Name:** P2-S04-offline-sync-push-and-conflict-resolution  
**Phase:** Phase 2  
**Responsibility:** Implement `sync.push` as the offline-first reconciliation endpoint that applies queued client operations and reports per-item success or failure.

## II. System Dependencies & Architectural Context

**Upstream Dependencies:**
- P2-S01-backend-trpc-auth-and-contract-foundation.
- P2-S02-academic-crud-classes-assignments-and-exams.
- P2-S03-finance-crud-expenses-and-budgets.

**Downstream Dependents:**
- Frontend Dexie sync engine.
- Offline mode and reconnect flows.
- Assignment reminder deep-link recovery after reinstall or stale local cache.

**Inputs (Reference Materials):**
- `apps/backend/AGENTS.md`
- `docs/core/BACKEND_ARCH.md`
- `docs/core/ENDPOINT_REF.md`
- `docs/core/LLD.md`
- `docs/core/STORYBOARD.md`
- Existing repositories/services from P2-S02 and P2-S03.

**Resolved Gaps:**
- `sync_queue` is a client-side queue for MVP behavior; `sync.push` must not mutate server `sync_queue` statuses.
- The server response reports which client queue item IDs synced or failed.
- Older updates are considered successfully processed when the server version wins; they are not listed as failed.
- Unsupported operation/entity combinations fail per item without aborting the batch.

## III. Scope Boundaries

### A. In-Scope Elements

- Protected `sync.push` mutation.
- Batch processing for queued operations.
- Entity types:
  - `class`
  - `assignment`
  - `exam`
  - `expense`
  - `budget`
- Operations:
  - `create`
  - `update`
  - `delete`
- Last-write-wins conflict resolution using `updated_at`.
- Per-item response:
  - `{ synced: string[], failed: string[] }`
- Reuse of academic and finance services/repositories.
- Item-level error isolation.

### B. Out-of-Scope Elements

- Client Dexie queue status updates.
- Server-side queue persistence.
- Notification scheduling.
- AI chat writes.
- New entity types outside the MVP endpoint reference.

## IV. Technical Delivery Requirements

### A. Artifacts & Deliverables to Produce

- `apps/backend/src/routers/sync.ts`
- `apps/backend/src/controllers/sync.controller.ts`
- `apps/backend/src/services/sync.service.ts`
- Any narrow sync-specific types/helpers needed to route items to existing services.
- Root router update wiring `sync`.

### B. Core Implementation Constraints

- `sync.push` is a `protectedProcedure`.
- The router validates only the batch shape and calls one controller method.
- The controller passes authenticated `userId` and Supabase client into the sync service.
- The sync service owns entity/operation dispatch.
- Repositories remain the only layer issuing Supabase queries.
- Each item is processed independently.
- A failure in one item must not prevent later items from being attempted.
- `payload.user_id` from the client must be ignored or overwritten with authenticated `userId`.
- For updates, the incoming payload must include `updated_at`; missing or invalid `updated_at` fails that item.
- For deletes, supported entities must soft-delete rather than hard-delete.

### C. Operation Matrix

Supported operations:

| Entity | create | update | delete |
| --- | --- | --- | --- |
| class | yes | yes | yes |
| assignment | yes | yes | yes |
| exam | yes | yes | yes |
| expense | yes | no | yes |
| budget | yes | yes | no |

Unsupported operations must add the sync queue item ID to `failed`.

### D. Response Contract

Input:

```ts
{
  items: Array<{
    id: string;
    entity_type: "class" | "assignment" | "exam" | "expense" | "budget";
    entity_id: string;
    operation: "create" | "update" | "delete";
    payload: Record<string, unknown>;
  }>;
}
```

Response:

```ts
{
  synced: string[];
  failed: string[];
}
```

## V. Validation & Exit Criteria

A successful implementation must verifiably satisfy:

- Unauthenticated requests return `UNAUTHORIZED` before batch processing.
- Valid mixed batches process every item.
- Successful item IDs are returned in `synced`.
- Failed item IDs are returned in `failed`.
- Stale updates are returned in `synced` but do not overwrite newer server records.
- Creates upsert by `id`.
- Deletes soft-delete supported entities.
- Unsupported operations fail per item.
- Client-provided `user_id` cannot write records under another user.
- `pnpm --filter @unilife-ai/backend build` succeeds.

## VI. Required Tests

- Build check: `pnpm --filter @unilife-ai/backend build`.
- Service unit tests for mixed success/failure batches.
- Tests for operation matrix enforcement.
- Tests for stale update handling.
- Tests proving one failed item does not abort the remaining batch.
- Procedure auth gating test for `sync.push`.
- Regression test that authenticated `userId` overrides or ignores `payload.user_id`.


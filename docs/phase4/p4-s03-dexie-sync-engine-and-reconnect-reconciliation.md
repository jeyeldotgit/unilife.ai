# P4-S03 Dexie Sync Engine and Reconnect Reconciliation

## I. Meta Specifications

**Spec Name:** P4-S03-dexie-sync-engine-and-reconnect-reconciliation  
**Phase:** Phase 4  
**Responsibility:** Implement the real frontend sync engine, local queue mutation lifecycle, and reconnect reconciliation flow so offline CRUD changes survive and sync automatically.

## II. System Dependencies & Architectural Context

**Upstream Dependencies:**
- `P4-S01` real data integration.
- `P2-S04` backend sync push endpoint.
- Phase 3 shared app shell and offline banner foundations.

**Downstream Dependents:**
- `P4-S04` local parser writes and offline chat confirmations.
- `P4-S05` offline-safe reminder persistence.
- `P4-S06` trustworthy planning features that rely on complete local state.

**Inputs (Reference Materials):**
- `docs/core/LLD.md`
- `docs/core/STORYBOARD.md`
- `docs/core/ENDPOINT_REF.md`
- `apps/frontend/src/lib/db/dexie.ts`
- `apps/frontend/src/lib/sync/sync-engine.ts`
- `apps/backend/src/routes/sync.route.ts`
- `apps/backend/src/services/sync.service.ts`
- `packages/types/src/sync-queue.ts`
- `packages/shared/src/constants.ts`

**Resolved Gaps:**
- The frontend sync engine currently exists as a design stub and must become executable code.
- Local-first writes are allowed in offline mode even though online mode still favors Server Actions.
- Dexie is the local source of truth while offline; Supabase remains the remote source of truth once synchronized.

## III. Scope Boundaries

### A. In-Scope Elements

- Executable sync engine implementation.
- Local queue item creation helpers for offline CRUD operations.
- Connectivity listeners and automatic flush-on-reconnect behavior.
- Sync status transitions:
  - `pending`
  - `syncing`
  - `synced`
  - `failed`
- Retry counting and failure limits.
- Hydration of local feature tables from the backend where needed to support offline reads.
- UI feedback for reconnect sync success/failure states.

### B. Out-of-Scope Elements

- Local parser itself.
- Reminder scheduling logic.
- New backend sync endpoints beyond the existing push path, unless contract gaps are discovered and documented.
- Full bidirectional delta-download architecture if not required for MVP Phase 4 reliability.

## IV. Technical Delivery Requirements

### A. Artifacts & Deliverables to Produce

- `apps/frontend/src/lib/sync/sync-engine.ts` - replace the contract stub with real code.
- `apps/frontend/src/lib/sync/*` - create any queue, flush, hydration, or conflict helpers required.
- `apps/frontend/src/lib/db/dexie.ts` - modify only as needed for indexes or schema support.
- Relevant feature actions or local mutation helpers to enqueue sync items.
- Shared UI feedback surface(s) for sync success/failure if current components are insufficient.

### B. Core Implementation Constraints

- `sync-engine.ts` must export real start, stop, and flush behavior.
- Queue processing order must be oldest-first by `created_at`.
- Every queue item must update status and retry metadata deterministically.
- A failed item must not block later items in the same flush.
- The engine must never assume online status solely from a one-time page load check; it must listen to connectivity changes.
- The frontend must not mark local data as permanently synced until the backend confirms the queue item ID in the response.
- Sync UI feedback must be subtle and non-blocking, matching the storyboard expectation of banners/pills rather than modal interruptions.

### C. Reconciliation Expectations

The implementation must cover:

- Offline create, update, and delete queueing for supported entities.
- Reconnect-triggered `POST /api/sync/push`.
- Per-item success and failure reconciliation using returned queue item IDs.
- Retry increments up to the configured limit.
- Last-write-wins handling as enforced by the backend.
- Stable behavior when a previously pending item is stale but accepted as successfully processed by the backend.

## V. Validation & Exit Criteria

A successful implementation must verifiably satisfy:

- CRUD changes made offline are stored locally and enqueued.
- Regaining connectivity automatically triggers a queue flush.
- Synced items transition out of `pending` and `syncing` correctly.
- Failed items increment retry counts and eventually land in `failed` after the configured limit.
- The app surfaces a sync completion confirmation without breaking current route layouts.
- `pnpm --filter @unilife-ai/frontend build` succeeds.

## VI. Required Tests

- Build check: `pnpm --filter @unilife-ai/frontend build`.
- Sync-engine integration coverage for:
  - queue ordering
  - mixed success/failure flushes
  - retry increment behavior
  - reconnect-triggered flushing
- Regression coverage that one failed queue item does not abort subsequent items.

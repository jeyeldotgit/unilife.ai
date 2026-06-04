# P2-S02 Academic CRUD Classes Assignments and Exams

## I. Meta Specifications

**Spec Name:** P2-S02-academic-crud-classes-assignments-and-exams  
**Phase:** Phase 2  
**Responsibility:** Implement protected academic CRUD procedures for classes, assignments, and exams using the required router-controller-service-repository architecture.

## II. System Dependencies & Architectural Context

**Upstream Dependencies:**
- P2-S01-backend-trpc-auth-and-contract-foundation.

**Downstream Dependents:**
- P2-S04 offline sync push, which reuses academic repositories/services for queued operations.
- Frontend offline sync engine and Dexie reconciliation flows.
- Dashboard, weekly schedule, assignment detail, reminder deep-link, and free-time context stories.

**Inputs (Reference Materials):**
- `apps/backend/AGENTS.md`
- `docs/core/BACKEND_ARCH.md`
- `docs/core/ENDPOINT_REF.md`
- `docs/core/LLD.md`
- `docs/core/STORYBOARD.md`
- `packages/database/src/schema/classes.ts`
- `packages/database/src/schema/assignments.ts`
- `packages/database/src/schema/exams.ts`
- `packages/types/src/class.ts`
- `packages/types/src/assignment.ts`
- `packages/types/src/exam.ts`

**Resolved Gaps:**
- Endpoint docs use snake_case response fields; backend must preserve API wire shapes from `ENDPOINT_REF.md` even if Drizzle schema files expose camelCase TypeScript properties.
- Supabase RLS is already applied, but repositories must still scope every query by `user_id`.
- Class delete behavior in `ENDPOINT_REF.md` says linked assignments remain; because soft delete does not trigger `ON DELETE SET NULL`, the backend must not promise DB cascade behavior during soft deletes.

## III. Scope Boundaries

### A. In-Scope Elements

- Protected routers/controllers/services/repositories for:
  - `classes`
  - `assignments`
  - `exams`
- Procedures:
  - `classes.list`
  - `classes.get`
  - `classes.create`
  - `classes.update`
  - `classes.delete`
  - `assignments.list`
  - `assignments.get`
  - `assignments.create`
  - `assignments.update`
  - `assignments.delete`
  - `exams.list`
  - `exams.get`
  - `exams.create`
  - `exams.update`
  - `exams.delete`
- User scoping by authenticated `ctx.userId`.
- Ownership checks for single-record reads, updates, and deletes.
- Soft delete using `deleted_at`.
- Delta list filtering with `updated_at > since`.
- Last-write-wins updates using incoming `updated_at`.
- Zod validation matching `ENDPOINT_REF.md`.
- Repository methods reusable by `sync.push`.

### B. Out-of-Scope Elements

- Finance entities: expenses and budgets.
- Sync batch orchestration.
- AI chat intent parsing.
- Frontend Dexie writes and notification scheduling.
- Server-side notification scheduling.

## IV. Technical Delivery Requirements

### A. Artifacts & Deliverables to Produce

- Academic tRPC routers:
  - `apps/backend/src/routers/classes.ts`
  - `apps/backend/src/routers/assignments.ts`
  - `apps/backend/src/routers/exams.ts`
- Controllers:
  - `classes.controller.ts`
  - `assignments.controller.ts`
  - `exams.controller.ts`
- Services:
  - `classes.service.ts`
  - `assignments.service.ts`
  - `exams.service.ts`
- Repositories:
  - `classes.repository.ts`
  - `assignments.repository.ts`
  - `exams.repository.ts`
- Root router updates wiring all three routers under their documented names.
- Shared academic validation helpers only if they reduce duplication without hiding endpoint-specific schema rules.

### B. Core Implementation Constraints

- All procedures are `protectedProcedure`.
- Routers define Zod schemas and call exactly one controller method.
- Controllers may throw `TRPCError` for:
  - `NOT_FOUND`
  - `FORBIDDEN`
  - mapped service/repository failures where appropriate.
- Services implement last-write-wins and shape records for create/update.
- Repositories perform Supabase queries with both `id` and `user_id` filters where applicable.
- List repositories always exclude `deleted_at` rows.
- `get` procedures return `{ class: null }`, `{ assignment: null }`, or `{ exam: null }` for missing records, matching `ENDPOINT_REF.md`.
- Update procedures return the full record or `null` when the incoming `updated_at` loses conflict resolution.
- Delete procedures return `{ ok: boolean }` and must not hard-delete rows.

### C. Endpoint Contracts

Class procedures must support:
- `list({ since?: string })`
- `get({ id })`
- `create({ id, subject, day_of_week, start_time, end_time, room?, instructor?, color?, created_at, updated_at })`
- `update({ id, subject?, room?, instructor?, day_of_week?, start_time?, end_time?, color?, is_active?, updated_at })`
- `delete({ id })`

Assignment procedures must support:
- `list({ since?: string })`
- `get({ id })`
- `create({ id, title, due_date, class_id?, description?, status?, priority?, created_at, updated_at })`
- `update({ id, title?, due_date?, class_id?, description?, status?, priority?, updated_at })`
- `delete({ id })`

Exam procedures must support:
- `list({ since?: string })`
- `get({ id })`
- `create({ id, title, exam_date, class_id?, description?, location?, created_at, updated_at })`
- `update({ id, title?, exam_date?, class_id?, description?, location?, updated_at })`
- `delete({ id })`

## V. Validation & Exit Criteria

A successful implementation must verifiably satisfy:

- All academic procedures reject unauthenticated requests before business logic runs.
- Users can only read or mutate their own records.
- List procedures exclude soft-deleted records.
- List procedures return only records with `updated_at > since` when `since` is provided.
- Create procedures write authenticated `user_id` from context, never from client input.
- Update procedures do not overwrite newer server records with older client payloads.
- Delete procedures set `deleted_at` and return `{ ok: true }` when the target belongs to the user.
- Academic repositories can be called by P2-S04 without duplicating Supabase query logic.
- `pnpm --filter @unilife-ai/backend build` succeeds.

## VI. Required Tests

- Build check: `pnpm --filter @unilife-ai/backend build`.
- Service unit tests with mocked repositories for last-write-wins wins/losses.
- Repository integration-style tests with mocked Supabase chains for user scoping and soft-delete filters.
- Procedure tests for auth gating on each academic router.
- Regression tests for ownership, `since` filtering, create user injection, update conflict rejection, and soft delete.


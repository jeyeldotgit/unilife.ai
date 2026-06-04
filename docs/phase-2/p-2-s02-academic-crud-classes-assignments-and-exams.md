# P2-S02 Academic CRUD Classes Assignments and Exams

## I. Meta Specifications

**Spec Name:** P2-S02-academic-crud-classes-assignments-and-exams  
**Phase:** Phase 2  
**Responsibility:** Implement protected academic REST CRUD endpoints for classes, assignments, and exams using the required route-controller-service-repository architecture.

## II. System Dependencies & Architectural Context

**Upstream Dependencies:**
- P2-S01-backend-rest-auth-and-contract-foundation.

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

- Protected routes/controllers/services/repositories for:
  - `classes`
  - `assignments`
  - `exams`
- Endpoints:
  - `GET /api/classes`
  - `GET /api/classes/:id`
  - `POST /api/classes`
  - `PATCH /api/classes/:id`
  - `DELETE /api/classes/:id`
  - `GET /api/assignments`
  - `GET /api/assignments/:id`
  - `POST /api/assignments`
  - `PATCH /api/assignments/:id`
  - `DELETE /api/assignments/:id`
  - `GET /api/exams`
  - `GET /api/exams/:id`
  - `POST /api/exams`
  - `PATCH /api/exams/:id`
  - `DELETE /api/exams/:id`
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

- Academic REST routes:
  - `apps/backend/src/routes/classes.route.ts`
  - `apps/backend/src/routes/assignments.route.ts`
  - `apps/backend/src/routes/exams.route.ts`
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
- Root route registration updates wiring all three route groups under their documented paths.
- Shared academic validation helpers only if they reduce duplication without hiding endpoint-specific schema rules.

### B. Core Implementation Constraints

- All endpoints use the shared auth middleware from P2-S01.
- Routes define Zod schemas, parse path/query/body input, and call exactly one controller method.
- Controllers may return or throw mapped REST errors for:
  - `NOT_FOUND`
  - `FORBIDDEN`
  - mapped service/repository failures where appropriate.
- Services implement last-write-wins and shape records for create/update.
- Repositories perform Supabase queries with both `id` and `user_id` filters where applicable.
- List repositories always exclude `deleted_at` rows.
- `GET /:id` endpoints return `{ class: null }`, `{ assignment: null }`, or `{ exam: null }` for missing records, matching `ENDPOINT_REF.md`.
- Update endpoints return the full record or `null` when the incoming `updated_at` loses conflict resolution.
- Delete endpoints return `{ ok: boolean }` and must not hard-delete rows.

### C. Endpoint Contracts

Class endpoints must support:
- `GET /api/classes?since=...`
- `GET /api/classes/:id`
- `POST /api/classes`
- `PATCH /api/classes/:id`
- `DELETE /api/classes/:id`

Assignment endpoints must support:
- `GET /api/assignments?since=...`
- `GET /api/assignments/:id`
- `POST /api/assignments`
- `PATCH /api/assignments/:id`
- `DELETE /api/assignments/:id`

Exam endpoints must support:
- `GET /api/exams?since=...`
- `GET /api/exams/:id`
- `POST /api/exams`
- `PATCH /api/exams/:id`
- `DELETE /api/exams/:id`

## V. Validation & Exit Criteria

A successful implementation must verifiably satisfy:

- All academic endpoints reject unauthenticated requests before business logic runs.
- Users can only read or mutate their own records.
- List endpoints exclude soft-deleted records.
- List endpoints return only records with `updated_at > since` when `since` is provided.
- Create endpoints write authenticated `user_id` from context, never from client input.
- Update endpoints do not overwrite newer server records with older client payloads.
- Delete endpoints set `deleted_at` and return `{ ok: true }` when the target belongs to the user.
- Academic repositories can be called by P2-S04 without duplicating Supabase query logic.
- `pnpm --filter @unilife-ai/backend build` succeeds.

## VI. Required Tests

- Build check: `pnpm --filter @unilife-ai/backend build`.
- Service unit tests with mocked repositories for last-write-wins wins/losses.
- Repository integration-style tests with mocked Supabase chains for user scoping and soft-delete filters.
- Endpoint tests for auth gating on each academic route group.
- Regression tests for ownership, `since` filtering, create user injection, update conflict rejection, and soft delete.

# P2-S03 Finance CRUD Expenses and Budgets

## I. Meta Specifications

**Spec Name:** P2-S03-finance-crud-expenses-and-budgets  
**Phase:** Phase 2  
**Responsibility:** Implement protected finance procedures for expenses and budgets, including list filters, budget ordering, and finance service behavior needed by onboarding and allowance features.

## II. System Dependencies & Architectural Context

**Upstream Dependencies:**
- P2-S01-backend-trpc-auth-and-contract-foundation.

**Downstream Dependents:**
- P2-S04 offline sync push.
- P2-S05 AI chat allowance forecast and budget query responses.
- Frontend onboarding budget setup and expenses screen.

**Inputs (Reference Materials):**
- `apps/backend/AGENTS.md`
- `docs/core/BACKEND_ARCH.md`
- `docs/core/ENDPOINT_REF.md`
- `docs/core/LLD.md`
- `docs/core/STORYBOARD.md`
- `packages/database/src/schema/expenses.ts`
- `packages/database/src/schema/budgets.ts`
- `packages/types/src/expense.ts`
- `packages/types/src/budget.ts`

**Resolved Gaps:**
- Expense amounts are stored as numeric values in Supabase; API responses must return numbers, not numeric strings.
- Expense update is intentionally out of MVP scope; incorrect expenses are deleted and re-logged.
- Budgets are not soft-deleted in the documented MVP schema, so this spec does not introduce budget delete behavior.

## III. Scope Boundaries

### A. In-Scope Elements

- Protected routers/controllers/services/repositories for:
  - `expenses`
  - `budgets`
- Procedures:
  - `expenses.list`
  - `expenses.create`
  - `expenses.delete`
  - `budgets.list`
  - `budgets.create`
  - `budgets.update`
- Expense filtering:
  - `since`
  - `from`
  - `to`
  - `category`
- Expense total aggregation across returned records.
- Budget ordering by `start_date` descending.
- User scoping and ownership checks.
- Zod validation matching `ENDPOINT_REF.md`.
- Repository methods reusable by `sync.push`.

### B. Out-of-Scope Elements

- Expense update procedure.
- Budget delete procedure.
- Academic entities.
- Sync batch orchestration.
- AI Gemini call implementation.
- Client-side active budget selection.

## IV. Technical Delivery Requirements

### A. Artifacts & Deliverables to Produce

- Finance tRPC routers:
  - `apps/backend/src/routers/expenses.ts`
  - `apps/backend/src/routers/budgets.ts`
- Controllers:
  - `expenses.controller.ts`
  - `budgets.controller.ts`
- Services:
  - `expenses.service.ts`
  - `budgets.service.ts`
- Repositories:
  - `expenses.repository.ts`
  - `budgets.repository.ts`
- Root router updates wiring finance routers under `expenses` and `budgets`.

### B. Core Implementation Constraints

- All finance procedures are `protectedProcedure`.
- Client input must never be trusted for `user_id`; context user ID is authoritative.
- Expense repositories must exclude `deleted_at` rows for reads.
- Expense delete must set `deleted_at`, not hard-delete.
- Budget reads must be scoped by `user_id` and ordered by `start_date` descending.
- Budget updates use last-write-wins with `updated_at`, returning `null` when the payload is older than the server record.
- Expense totals must be computed after applying all filters.
- Services should expose methods that P2-S04 can reuse for create/delete/update-supported operations.

### C. Endpoint Contracts

Expense procedures must support:
- `list({ since?: string, from?: string, to?: string, category?: ExpenseCategory })`
- `create({ id, amount, category, budget_id?, description?, spent_at, created_at, updated_at })`
- `delete({ id })`

Expense categories:
- `food`
- `transportation`
- `school`
- `entertainment`
- `miscellaneous`

Budget procedures must support:
- `list({ since?: string })`
- `create({ id, amount, period, start_date, end_date, created_at, updated_at })`
- `update({ id, amount?, period?, end_date?, updated_at })`

Budget periods:
- `weekly`
- `biweekly`
- `monthly`

## V. Validation & Exit Criteria

A successful implementation must verifiably satisfy:

- All finance procedures reject unauthenticated requests before business logic runs.
- Expense reads are scoped to authenticated user and exclude soft-deleted rows.
- `expenses.list` applies date/category/delta filters together.
- `expenses.list` returns `{ expenses, total }`, where `total` is a number matching returned records.
- Expense creates inject authenticated `user_id`.
- Expense deletes set `deleted_at`.
- Budget lists return only the authenticated user's budgets ordered newest start date first.
- Budget updates reject stale payloads by returning `null`.
- Finance repositories/services are reusable by P2-S04.
- `pnpm --filter @unilife-ai/backend build` succeeds.

## VI. Required Tests

- Build check: `pnpm --filter @unilife-ai/backend build`.
- Service unit tests for expense totals and budget last-write-wins.
- Procedure tests for auth gating on `expenses` and `budgets`.
- Regression tests for expense filter combinations, soft delete, budget ordering, user scoping, and stale budget update rejection.


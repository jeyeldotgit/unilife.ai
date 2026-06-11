# P4-S01 Real Data Integration and Retire Frontend Mocks

## I. Meta Specifications

**Spec Name:** P4-S01-real-data-integration-and-retire-frontend-mocks  
**Phase:** Phase 4  
**Responsibility:** Replace remaining mock-backed frontend feature flows with authenticated backend-backed API adapters while preserving the Phase 3 route and Server Action architecture.

## II. System Dependencies & Architectural Context

**Upstream Dependencies:**
- Phase 3 frontend refactor specs, especially `FE-S04`, `FE-S05`, and `FE-S06`.
- `P2-S01` backend REST auth and contracts.
- `P2-S02` academic CRUD.
- `P2-S03` finance CRUD.
- `P2-S05` AI chat backend contract.

**Downstream Dependents:**
- `P4-S02` exams frontend delivery.
- `P4-S03` sync hydration and reconciliation.
- `P4-S04` online chat fallback and local/offline split.
- `P4-S06` dashboard and planning experiences.

**Inputs (Reference Materials):**
- `docs/core/ENDPOINT_REF.md`
- `docs/core/LLD.md`
- `docs/core/STORYBOARD.md`
- `apps/frontend/src/lib/api/*.ts`
- `apps/frontend/src/lib/mock/*`
- `apps/frontend/src/actions/*.ts`
- `apps/frontend/src/lib/supabase/*`
- `apps/backend/src/routes/*`

**Resolved Gaps:**
- Mock fixtures may remain only for isolated storybook-like development helpers or tests, not as the primary data source for authenticated app routes.
- The backend is the online source of truth; Dexie becomes the offline cache and queue layer in later specs.
- Frontend adapters must shape backend data into existing UI-friendly view models without moving transformation logic into pages.

## III. Scope Boundaries

### A. In-Scope Elements

- Real backend-backed implementations for:
  - `schedule`
  - `assignments`
  - `expenses`
  - `budget`
  - `chat`
- Shared authenticated frontend API client helper(s).
- Online error handling and empty-state handling for server-entry routes.
- Removal or quarantine of primary mock dependencies from app-facing loaders and mutations.
- Environment variable and URL handling for the frontend-to-backend boundary.

### B. Out-of-Scope Elements

- Dexie queue flushing and reconnect reconciliation.
- Local parser intent execution.
- Notifications.
- New AI capabilities beyond replacing the mock online chat path.
- Exams feature delivery, which belongs to `P4-S02`.

## IV. Technical Delivery Requirements

### A. Artifacts & Deliverables to Produce

- `apps/frontend/src/lib/api/client.ts` - create a shared authenticated backend request helper.
- `apps/frontend/src/lib/api/schedule.ts` - modify to use backend REST when online.
- `apps/frontend/src/lib/api/assignments.ts` - modify to use backend REST when online.
- `apps/frontend/src/lib/api/expenses.ts` - modify to use backend REST when online.
- `apps/frontend/src/lib/api/budget.ts` - modify to use backend REST when online.
- `apps/frontend/src/lib/api/chat.ts` - modify to call the backend AI route when online.
- `apps/frontend/src/actions/*.ts` - update as needed to use real adapters and preserve graceful failures.
- `apps/frontend/src/lib/mock/*` - remove app-critical usage paths.

### B. Core Implementation Constraints

- Frontend pages and client companions must continue importing through `lib/api/*`, not fetch the backend directly.
- Server Actions remain the default online mutation path.
- The API client helper must attach the authenticated user session token for protected backend routes.
- All backend base URL usage must come from environment configuration, not hardcoded localhost strings.
- API adapters must return typed, serializable data already shaped for existing route/page consumers.
- When the backend request fails, the API layer must throw typed or predictable errors so pages/actions can present non-crashing fallback UI.
- No Phase 4 app route may read from `src/lib/mock/*` for its primary online load path after this spec completes.

### C. Endpoint Coverage Expectations

At minimum, the frontend adapters must support:

- `GET /api/classes`
- `POST /api/classes`
- `PATCH /api/classes/:id`
- `DELETE /api/classes/:id`
- `GET /api/assignments`
- `POST /api/assignments`
- `PATCH /api/assignments/:id`
- `DELETE /api/assignments/:id`
- `GET /api/expenses`
- `POST /api/expenses`
- `DELETE /api/expenses/:id`
- `GET /api/budgets`
- `POST /api/budgets`
- `PATCH /api/budgets/:id`
- `POST /api/ai/chat`

If an existing frontend feature requires a backend shape adjustment, update the shared contract documentation in the same workstream.

## V. Validation & Exit Criteria

A successful implementation must verifiably satisfy:

- Authenticated dashboard, schedule, assignments, expenses, onboarding, and chat flows no longer depend on mock fixtures for their primary online behavior.
- Server Actions still own online mutations for the corresponding features.
- Online chat uses the backend AI route rather than mock append/list helpers.
- API errors do not crash route rendering and instead resolve into stable empty/error states.
- Existing visual layouts remain recognizable even though data now comes from the backend.
- `pnpm --filter @unilife-ai/frontend build` succeeds.

## VI. Required Tests

- Build check: `pnpm --filter @unilife-ai/frontend build`.
- Lint check: `pnpm --filter @unilife-ai/frontend lint`.
- Adapter-level tests or smoke coverage for auth header attachment and response normalization.
- Regression coverage proving no app-facing `lib/api/*` function reads from `src/lib/mock/*` in its online path.

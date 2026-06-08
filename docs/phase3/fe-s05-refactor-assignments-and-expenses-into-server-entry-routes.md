### FE-S05 - Refactor assignments and expenses into server-entry routes

#### I. Meta Specifications
| Field | Value |
|---|---|
| **Spec ID** | FE-S05 |
| **Spec Name** | Refactor assignments and expenses into server-entry routes |
| **Responsibility** | Migrate the remaining data-heavy academic and finance pages onto the shared API, action, and UI layers so all authenticated CRUD-style pages follow the same backend-ready pattern. |

#### II. System Dependencies & Architectural Context

**Upstream Dependencies** - must be complete before this spec begins:
- `FE-S01` - provides the final authenticated shell and route structure.
- `FE-S02` - provides typed assignments, expenses, and budget APIs.
- `FE-S03` - provides `AssignmentCard`, `BudgetProgressCard`, `EmptyState`, and shared `Icon` usage.
- `FE-S04` - provides the established server-page/client-companion pattern to mirror.
- `apps/frontend/src/lib/api/assignments.ts` - supplies list and create contracts for assignments.
- `apps/frontend/src/lib/api/expenses.ts` - supplies expenses list and mutation contracts.
- `apps/frontend/src/lib/api/budget.ts` - supplies budget status used by the expenses page.

**Inputs - Reference Materials** - developer must read before executing:
- `docs/core/STORYBOARD.md § Story 3` - confirm assignment list behavior and chat-created assignment confirmation expectations.
- `docs/core/STORYBOARD.md § Story 5` - confirm expenses budget summary, category breakdown, and recent-expense grouping.
- `docs/core/STORYBOARD.md § Story 8` - confirm assignment reminder data requirements and detail-readiness.
- `docs/core/STORYBOARD.md § Story 9` - confirm offline-safe rendering expectations and empty-state behavior.
- `apps/frontend/src/app/(app)/assignments/page.tsx` - current monolithic assignments implementation to preserve visually.
- `apps/frontend/src/app/(app)/expenses/page.tsx` - current monolithic expenses implementation to preserve visually.
- `apps/frontend/src/components/ui/AssignmentCard.tsx` - shared assignment-card contract.
- `apps/frontend/src/components/ui/BudgetProgressCard.tsx` - shared budget-card contract.
- `apps/frontend/src/components/ui/EmptyState.tsx` - shared empty-state contract.

#### III. Scope Boundaries

**A. In-Scope**

- `apps/frontend/src/app/(app)/assignments/page.tsx` - MODIFY - convert into an async server component that fetches initial assignment data from `lib/api/assignments`.
- `apps/frontend/src/app/(app)/assignments/AssignmentsClient.tsx` - CREATE - own assignment filters, local interactions, and optimistic client state.
- `apps/frontend/src/app/(app)/expenses/page.tsx` - MODIFY - convert into an async server component that fetches budget and expense data from `lib/api/*`.
- `apps/frontend/src/app/(app)/expenses/ExpensesClient.tsx` - CREATE - own expense delete animations, local UI state, and optimistic interactions.
- `apps/frontend/src/actions/assignments.ts` - CREATE - expose assignment mutations as Server Actions.
- `apps/frontend/src/actions/expenses.ts` - CREATE - expose expense mutations as Server Actions.
- `apps/frontend/src/components/ui/AssignmentCard.tsx` - MODIFY - support the final typed assignment data shape if needed.
- `apps/frontend/src/components/ui/BudgetProgressCard.tsx` - MODIFY - support the final typed expense and dashboard budget payloads if needed.

**B. Out-of-Scope**

- Do not add a dedicated assignment detail route in this spec - this refactor remains route-neutral while carrying detail-ready data in shared types.
- Do not refactor chat or onboarding here - `FE-S06` owns those migrations.
- Do not replace current interaction timing or delete-animation feel on the expenses page - the behavior must remain visually identical.
- Do not add global state for assignments or expenses - route-local client state is sufficient.

#### IV. Technical Delivery Requirements

**A. Artifacts & Deliverables**

| File | Responsibility |
|---|---|
| `apps/frontend/src/app/(app)/assignments/page.tsx` | Server entry that fetches assignment data and passes typed props to `AssignmentsClient`. |
| `apps/frontend/src/app/(app)/assignments/AssignmentsClient.tsx` | Client companion that owns assignment filtering, toggles, and local interaction state. |
| `apps/frontend/src/app/(app)/expenses/page.tsx` | Server entry that fetches expense groups, category data, and budget status and passes them to `ExpensesClient`. |
| `apps/frontend/src/app/(app)/expenses/ExpensesClient.tsx` | Client companion that owns delete transitions, optimistic UI, and local expense interactions. |
| `apps/frontend/src/actions/assignments.ts` | Exports assignment Server Actions used by the assignments page. |
| `apps/frontend/src/actions/expenses.ts` | Exports expense Server Actions used by the expenses page. |

**B. Core Implementation Constraints**

- **Server Entry Rule:** `assignments/page.tsx` and `expenses/page.tsx` must not contain `"use client"` after this spec.
- **Action-Only Mutation Rule:** Create, update, and delete flows must go through `apps/frontend/src/actions/assignments.ts` or `apps/frontend/src/actions/expenses.ts`, never internal API routes.
- **Visual Parity Rule:** Assignment cards, expense rows, grouped recents, budget summary, category tiles, FAB placement, and nav spacing must render exactly as before.
- **Shared Empty State Rule:** If either feature API returns an empty array, the page must render `EmptyState` rather than ad hoc placeholder markup.
- **Graceful Rejection Rule:** Rejected mock API calls must surface a stable fallback UI and must not leave the page in an unmounted or broken state.

#### V. Validation & Exit Criteria

- [ ] **[Structural]** `apps/frontend/src/app/(app)/assignments/AssignmentsClient.tsx` exists and is imported by `assignments/page.tsx`.
- [ ] **[Structural]** `apps/frontend/src/app/(app)/expenses/ExpensesClient.tsx` exists and is imported by `expenses/page.tsx`.
- [ ] **[Boundary]** Neither `assignments/page.tsx` nor `expenses/page.tsx` contains inline mock arrays or inline feature types.
- [ ] **[Boundary]** `apps/frontend/src/actions/assignments.ts` and `apps/frontend/src/actions/expenses.ts` exist and own all feature mutations.
- [ ] **[Visual]** `/expenses` renders the identical UI to its pre-refactor state: same Tailwind classes, same mock data values, same delete interaction timing.
- [ ] **[Contract]** Assignment rendering consumes the shared assignment type from `lib/types/index.ts`, including the `reminders` field introduced in `FE-S02`.
- [ ] **[Storyboard gap]** The assignments and expenses pages now consume the shared `EmptyState` and typed API boundary instead of inconsistent page-local fallback handling.

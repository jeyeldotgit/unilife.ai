### FE-S04 - Refactor dashboard and schedule into server-entry routes

#### I. Meta Specifications
| Field | Value |
|---|---|
| **Spec ID** | FE-S04 |
| **Spec Name** | Refactor dashboard and schedule into server-entry routes |
| **Responsibility** | Migrate the first two authenticated features to the final server-page/client-companion pattern so the repo has a proven template for the remaining page refactors. |

#### II. System Dependencies & Architectural Context

**Upstream Dependencies** - must be complete before this spec begins:
- `FE-S01` - provides the final authenticated route group and shared shell.
- `FE-S02` - provides typed API access for schedule, assignments, and budget data.
- `FE-S03` - provides shared UI primitives, including `ClassBlock`, `ClassDetailSheet`, and `EmptyState`.
- `apps/frontend/src/lib/api/schedule.ts` - supplies weekly class and mutation contracts.
- `apps/frontend/src/lib/api/assignments.ts` - supplies deadline data used by the dashboard.
- `apps/frontend/src/lib/api/budget.ts` - supplies budget summary data used by the dashboard.

**Inputs - Reference Materials** - developer must read before executing:
- `docs/core/STORYBOARD.md § Story 2` - confirm dashboard sections, AI-card behavior, and empty/offline expectations.
- `docs/core/STORYBOARD.md § Story 4` - confirm weekly schedule layout and class-detail interaction.
- `docs/core/STORYBOARD.md § Story 9` - confirm offline indicator and graceful degradation expectations.
- `apps/frontend/src/app/(app)/dashboard/page.tsx` - current monolithic dashboard implementation to preserve visually.
- `apps/frontend/src/app/(app)/schedule/page.tsx` - current monolithic schedule implementation to preserve visually.
- `apps/frontend/src/components/layout/AppShell.tsx` - shell composition contract for all authenticated pages.
- `apps/frontend/src/components/ui/ClassDetailSheet.tsx` - class-detail primitive to integrate into schedule.

#### III. Scope Boundaries

**A. In-Scope**

- `apps/frontend/src/app/(app)/dashboard/page.tsx` - MODIFY - convert into an async server component that fetches initial dashboard inputs from `lib/api/*`.
- `apps/frontend/src/app/(app)/dashboard/DashboardClient.tsx` - CREATE - own all dashboard client-only behavior and browser state.
- `apps/frontend/src/app/(app)/schedule/page.tsx` - MODIFY - convert into an async server component that fetches weekly classes through `lib/api/schedule`.
- `apps/frontend/src/app/(app)/schedule/ScheduleClient.tsx` - CREATE - own schedule interactions, selected-class state, and bottom-sheet behavior.
- `apps/frontend/src/actions/schedule.ts` - CREATE - expose schedule mutations as Server Actions.
- `apps/frontend/src/components/layout/PageHeader.tsx` - MODIFY - support the exact header framing needed by dashboard and schedule once their page-level copies are removed.
- `apps/frontend/src/components/ui/BudgetProgressCard.tsx` - MODIFY - align prop inputs with dashboard composition needs if required.
- `apps/frontend/src/components/ui/ClassBlock.tsx` - MODIFY - accept the final shared schedule type shape if required.

**B. Out-of-Scope**

- Do not refactor assignments, expenses, chat, or onboarding in this spec - `FE-S05` and `FE-S06` own those features.
- Do not create a dashboard-specific API module - the dashboard must compose multiple feature APIs in the server page.
- Do not introduce React Query, SWR, or client-side fetch-on-mount patterns - the server page provides initial data.
- Do not add new dashboard cards or schedule interactions beyond what already exists in the storyboard and current page.

#### IV. Technical Delivery Requirements

**A. Artifacts & Deliverables**

| File | Responsibility |
|---|---|
| `apps/frontend/src/app/(app)/dashboard/page.tsx` | Server entry that composes `getClasses()`, `getAssignments()`, and `getBudgetStatus()` and passes typed props to `DashboardClient`. |
| `apps/frontend/src/app/(app)/dashboard/DashboardClient.tsx` | Client companion that owns browser-only behavior, offline-aware AI-card rendering, and local UI interactions. |
| `apps/frontend/src/app/(app)/schedule/page.tsx` | Server entry that fetches weekly schedule data and passes typed props to `ScheduleClient`. |
| `apps/frontend/src/app/(app)/schedule/ScheduleClient.tsx` | Client companion that owns class selection, bottom-sheet state, and add-class interactions. |
| `apps/frontend/src/actions/schedule.ts` | Exports schedule Server Actions used by `ScheduleClient` for mutations. |

**B. Core Implementation Constraints**

- **Server Entry Rule:** `dashboard/page.tsx` and `schedule/page.tsx` must not contain `"use client"` after this spec.
- **Client Boundary Rule:** Any code using `useState`, `useEffect`, `navigator`, event handlers, `setTimeout`, or DOM refs must live in the client companion.
- **Dashboard Composition Rule:** Dashboard data must be assembled in the server page from the schedule, assignments, and budget API modules.
- **Offline AI Rule:** The dashboard AI suggestion card must render an online/offline conditional state instead of always showing the online variant.
- **Schedule Detail Rule:** Schedule class detail must open through `ClassDetailSheet`, not an ad hoc inline panel or a new route.
- **Graceful Failure Rule:** If mock API calls reject, the route must render stable fallback UI and must not crash the page tree.

#### V. Validation & Exit Criteria

- [ ] **[Structural]** `apps/frontend/src/app/(app)/dashboard/DashboardClient.tsx` exists and `dashboard/page.tsx` imports it.
- [ ] **[Structural]** `apps/frontend/src/app/(app)/schedule/ScheduleClient.tsx` exists and `schedule/page.tsx` imports it.
- [ ] **[Boundary]** Neither `dashboard/page.tsx` nor `schedule/page.tsx` contains `"use client"`.
- [ ] **[Boundary]** `apps/frontend/src/actions/schedule.ts` exists and is the only mutation entry used by schedule UI.
- [ ] **[Visual]** `/schedule` preserves the current weekly grid, class block placement, and add-class CTA styling from the pre-refactor page.
- [ ] **[Contract]** `/dashboard` reads from `lib/api/schedule`, `lib/api/assignments`, and `lib/api/budget`, not from inline arrays.
- [ ] **[Storyboard gap]** `GAP-01` is closed: the dashboard AI suggestion card now has explicit online/offline conditional rendering logic.

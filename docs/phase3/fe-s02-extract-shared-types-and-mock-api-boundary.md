### FE-S02 - Extract shared types and the mock API boundary

#### I. Meta Specifications
| Field | Value |
|---|---|
| **Spec ID** | FE-S02 |
| **Spec Name** | Extract shared types and the mock API boundary |
| **Responsibility** | Define the backend-ready data contracts and one mock-access layer so feature pages can later switch from inline arrays to typed API calls without changing UI code. |

#### II. System Dependencies & Architectural Context

**Upstream Dependencies** - must be complete before this spec begins:
- `FE-S01` - provides the final `(app)` route-group paths and the shared shell baseline.
- `apps/frontend/src/components/ui/Icon.tsx` - establishes the shared UI import root used by later feature refactors.

**Inputs - Reference Materials** - developer must read before executing:
- `docs/core/STORYBOARD.md § Story 2` - identify dashboard data needs: today's classes, deadlines, budget status, AI card state.
- `docs/core/STORYBOARD.md § Story 3` - identify chat message, quick action, and assignment-creation data needs.
- `docs/core/STORYBOARD.md § Story 4` - identify weekly schedule and class-detail data needs.
- `docs/core/STORYBOARD.md § Story 5` - identify budget status, category breakdown, and recent expense data needs.
- `docs/core/STORYBOARD.md § Story 8` - identify assignment reminder state required by the detail view.
- `docs/core/STORYBOARD.md § Story 9` - identify offline rejection expectations and fallback behavior.
- `docs/core/STORYBOARD.md § Story 10` - identify free-time recommendation message payload needs for chat.
- `apps/frontend/src/app/(app)/dashboard/page.tsx` - current inline dashboard data and presentation assumptions.
- `apps/frontend/src/app/(app)/schedule/page.tsx` - current inline schedule and free-window data.
- `apps/frontend/src/app/(app)/assignments/page.tsx` - current assignment shape and filter assumptions.
- `apps/frontend/src/app/(app)/expenses/page.tsx` - current expense grouping and budget-card assumptions.
- `apps/frontend/src/app/(app)/chat/page.tsx` - current message-state shape to replace with serializable types.

#### III. Scope Boundaries

**A. In-Scope**

- `apps/frontend/src/lib/types/index.ts` - CREATE - define all shared frontend data contracts for schedule, assignments, expenses, budget, chat, and onboarding starter data.
- `apps/frontend/src/types/index.ts` - CREATE - re-export the shared types from `lib/types/index.ts`.
- `apps/frontend/src/lib/mock/schedule.ts` - CREATE - own all mock schedule and class-detail data.
- `apps/frontend/src/lib/mock/assignments.ts` - CREATE - own all mock assignment list and reminder data.
- `apps/frontend/src/lib/mock/expenses.ts` - CREATE - own all mock expense groups, category totals, and budget-linked values.
- `apps/frontend/src/lib/mock/budget.ts` - CREATE - own budget summary fixtures used by dashboard and expenses.
- `apps/frontend/src/lib/mock/chat.ts` - CREATE - own serializable mock message and quick-action fixtures.
- `apps/frontend/src/lib/api/schedule.ts` - CREATE - expose the schedule API contract backed by `lib/mock/schedule.ts`.
- `apps/frontend/src/lib/api/assignments.ts` - CREATE - expose the assignments API contract backed by `lib/mock/assignments.ts`.
- `apps/frontend/src/lib/api/expenses.ts` - CREATE - expose the expenses API contract backed by `lib/mock/expenses.ts`.
- `apps/frontend/src/lib/api/budget.ts` - CREATE - expose the budget API contract backed by `lib/mock/budget.ts`.
- `apps/frontend/src/lib/api/chat.ts` - CREATE - expose the chat API contract backed by `lib/mock/chat.ts`.

**B. Out-of-Scope**

- Do not refactor page JSX or split pages into server and client components yet - `FE-S04` through `FE-S06` own feature migrations.
- Do not create server actions in this spec - later feature specs own mutation wiring per feature.
- Do not import these new modules into pages directly from `lib/mock/` - only `lib/api/` may touch mock modules.
- Do not introduce real HTTP, Supabase CRUD, Hono calls, or internal `/api/*` routes - this spec is mock-boundary only.

#### IV. Technical Delivery Requirements

**A. Artifacts & Deliverables**

| File | Responsibility |
|---|---|
| `apps/frontend/src/lib/types/index.ts` | Exports all shared interfaces and type aliases used across app pages, components, APIs, and actions. |
| `apps/frontend/src/types/index.ts` | Re-exports all shared types from `lib/types/index.ts`. |
| `apps/frontend/src/lib/mock/schedule.ts` | Exports typed mock weekly classes, free windows, and class-detail fixtures. |
| `apps/frontend/src/lib/mock/assignments.ts` | Exports typed mock assignments, including reminder states for detail-ready data. |
| `apps/frontend/src/lib/mock/expenses.ts` | Exports typed mock expenses, grouped recents, and category-breakdown fixtures. |
| `apps/frontend/src/lib/mock/budget.ts` | Exports typed mock budget summary data. |
| `apps/frontend/src/lib/mock/chat.ts` | Exports serializable chat history and quick-action fixtures. |
| `apps/frontend/src/lib/api/schedule.ts` | Exports `getClasses()` and `createClass()` backed by the schedule mocks. |
| `apps/frontend/src/lib/api/assignments.ts` | Exports `getAssignments()` and `createAssignment()` backed by the assignments mocks. |
| `apps/frontend/src/lib/api/expenses.ts` | Exports `getExpenses()`, `logExpense()`, and `deleteExpense()` backed by the expenses mocks. |
| `apps/frontend/src/lib/api/budget.ts` | Exports `getBudgetStatus()` backed by the budget mocks. |
| `apps/frontend/src/lib/api/chat.ts` | Exports `sendMessage()` backed by the chat mocks. |

**B. Core Implementation Constraints**

- **API-Only Mock Access Rule:** No component, page, layout, or action file may import from `lib/mock/` directly.
- **Serializable Contract Rule:** Shared types must not include `ReactNode`, component constructors, or `any`.
- **Reminder Coverage Rule:** The shared assignment contract must include a `reminders` field that can represent sent and pending reminder states for Story 8.
- **Offline Signal Rule:** Every `lib/api/*` function must accept an optional offline signal and reject gracefully when instructed to behave offline.
- **Delay Fidelity Rule:** Every mock-backed API function must resolve or reject asynchronously after a 300-500ms simulated delay.
- **Dashboard Composition Rule:** There is no `dashboard.ts` API module; dashboard data must be composed later from schedule, assignments, and budget APIs.

#### V. Validation & Exit Criteria

- [ ] **[Structural]** `apps/frontend/src/lib/types/index.ts` exists and exports the shared data contracts used by all protected features.
- [ ] **[Structural]** `apps/frontend/src/types/index.ts` exists and only re-exports from `lib/types/index.ts`.
- [ ] **[Boundary]** No file outside `apps/frontend/src/lib/api/` contains an import from `apps/frontend/src/lib/mock/`.
- [ ] **[Contract]** `apps/frontend/src/lib/api/expenses.ts` exports `getExpenses`, `logExpense`, and `deleteExpense`.
- [ ] **[Contract]** `apps/frontend/src/lib/api/assignments.ts` exports a type-safe assignment API whose assignment type includes `reminders`.
- [ ] **[Contract]** Mock data in `apps/frontend/src/lib/mock/*.ts` satisfies shared interfaces from `apps/frontend/src/lib/types/index.ts` with no `any` types.
- [ ] **[Storyboard gap]** `GAP-03` is closed: the shared assignment model now carries reminder data required by Story 8.

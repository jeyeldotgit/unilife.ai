### FE-S01 - Establish the authenticated shell and route skeleton

#### I. Meta Specifications

| Field              | Value                                                                                                                                          |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **Spec ID**        | FE-S01                                                                                                                                         |
| **Spec Name**      | Establish the authenticated shell and route skeleton                                                                                           |
| **Responsibility** | Create the canonical app shell, route-group baseline, and shared Icon ownership so every later feature refactor lands on one stable structure. |

#### II. System Dependencies & Architectural Context

**Upstream Dependencies** - must be complete before this spec begins:

- None - this is the baseline architectural spec for the refactor.

**Inputs - Reference Materials** - developer must read before executing:

- `docs/core/STORYBOARD.md § Story 2` - confirm dashboard header, shell, and summary-card framing.
- `docs/core/STORYBOARD.md § Story 4` - confirm schedule shell and persistent bottom navigation expectations.
- `docs/core/STORYBOARD.md § Story 5` - confirm expenses shell and FAB placement.
- `docs/core/STORYBOARD.md § Story 9` - confirm the offline indicator must be a subtle top pill, not a full-screen state.
- `apps/frontend/src/app/layout.tsx` - current root layout ownership and font loading baseline.
- `apps/frontend/src/app/(protected)/layout.tsx` - current auth gate logic to preserve.
- `apps/frontend/src/app/(protected)/dashboard/layout.tsx` - current nested layout anti-pattern to remove.
- `apps/frontend/src/app/(protected)/assignments/layout.tsx` - current nested layout anti-pattern to remove.
- `apps/frontend/src/app/(protected)/expenses/layout.tsx` - current nested layout anti-pattern to remove.

#### III. Scope Boundaries

**A. In-Scope**

- `apps/frontend/src/app/layout.tsx` - MODIFY - become the single owner of `<html>`, `<body>`, and the Material Symbols CDN link.
- `apps/frontend/src/app/(app)/layout.tsx` - CREATE - host the authenticated shell entry and preserve the current auth redirect behavior.
- `apps/frontend/src/app/(protected)/dashboard/page.tsx -> apps/frontend/src/app/(app)/dashboard/page.tsx` - MOVE - relocate the dashboard route into the final authenticated route group.
- `apps/frontend/src/app/(protected)/schedule/page.tsx -> apps/frontend/src/app/(app)/schedule/page.tsx` - MOVE - relocate the schedule route into the final authenticated route group.
- `apps/frontend/src/app/(protected)/assignments/page.tsx -> apps/frontend/src/app/(app)/assignments/page.tsx` - MOVE - relocate the assignments route into the final authenticated route group.
- `apps/frontend/src/app/(protected)/expenses/page.tsx -> apps/frontend/src/app/(app)/expenses/page.tsx` - MOVE - relocate the expenses route into the final authenticated route group.
- `apps/frontend/src/app/(protected)/chat/page.tsx -> apps/frontend/src/app/(app)/chat/page.tsx` - MOVE - relocate the chat route into the final authenticated route group.
- `apps/frontend/src/app/(protected)/dashboard/layout.tsx` - DELETE - remove nested `html/head/body` ownership from the dashboard route.
- `apps/frontend/src/app/(protected)/assignments/layout.tsx` - DELETE - remove nested `html/head/body` ownership from the assignments route.
- `apps/frontend/src/app/(protected)/expenses/layout.tsx` - DELETE - remove nested `html/head/body` ownership from the expenses route.
- `apps/frontend/src/components/layout/AppShell.tsx` - CREATE - become the single authenticated shell wrapper.
- `apps/frontend/src/components/layout/BottomNav.tsx` - CREATE - centralize route-aware bottom navigation.
- `apps/frontend/src/components/layout/OfflineBanner.tsx` - CREATE - implement the subtle online/offline pill required by Story 9.
- `apps/frontend/src/components/layout/PageHeader.tsx` - CREATE - centralize shared protected-page header framing.
- `apps/frontend/src/components/ui/Icon.tsx` - CREATE - become the only Material Symbols wrapper in the app.

**B. Out-of-Scope**

- Do not refactor feature data, mock arrays, or page-local state yet - `FE-S02` and later specs own the data boundary and feature migrations.
- Do not move onboarding out of `(protected)` in this spec - `FE-S06` owns onboarding relocation and consolidation.
- Do not add new page-level UI primitives such as empty states or bottom sheets here - `FE-S03` owns shared feature primitives.
- Do not change any Tailwind class strings or inline visual styling - this spec only normalizes shell ownership and route structure.

#### IV. Technical Delivery Requirements

**A. Artifacts & Deliverables**

| File                                                    | Responsibility                                                                                           |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `apps/frontend/src/app/layout.tsx`                      | Exports the only root layout and loads Material Symbols once for the whole app.                          |
| `apps/frontend/src/app/(app)/layout.tsx`                | Exports the authenticated layout that preserves Supabase auth gating and wraps children with `AppShell`. |
| `apps/frontend/src/app/(app)/dashboard/page.tsx`        | Exists at the final authenticated route-group path with no visual edits yet.                             |
| `apps/frontend/src/app/(app)/schedule/page.tsx`         | Exists at the final authenticated route-group path with no visual edits yet.                             |
| `apps/frontend/src/app/(app)/assignments/page.tsx`      | Exists at the final authenticated route-group path with no visual edits yet.                             |
| `apps/frontend/src/app/(app)/expenses/page.tsx`         | Exists at the final authenticated route-group path with no visual edits yet.                             |
| `apps/frontend/src/app/(app)/chat/page.tsx`             | Exists at the final authenticated route-group path with no visual edits yet.                             |
| `apps/frontend/src/components/layout/AppShell.tsx`      | Exports the client shell used by all authenticated routes.                                               |
| `apps/frontend/src/components/layout/BottomNav.tsx`     | Exports the route-aware bottom navigation for authenticated routes.                                      |
| `apps/frontend/src/components/layout/OfflineBanner.tsx` | Exports the online/offline pill banner component.                                                        |
| `apps/frontend/src/components/layout/PageHeader.tsx`    | Exports a reusable protected-page header frame.                                                          |
| `apps/frontend/src/components/ui/Icon.tsx`              | Exports the single source of truth Material Symbols wrapper.                                             |

**B. Core Implementation Constraints**

- **Single Root Layout Rule:** Only `apps/frontend/src/app/layout.tsx` may render `<html>` or `<body>` after this spec.
- **Canonical Icon Rule:** No page, layout, or component may define its own Material Symbols wrapper after `components/ui/Icon.tsx` exists.
- **Authenticated Shell Rule:** All routes in `(app)` must render inside `AppShell`; no page may inline its own persistent bottom nav after this spec.
- **Offline Indicator Rule:** `OfflineBanner` must use `navigator.onLine` plus `online` and `offline` window events, matching Story 9's pill-banner behavior.
- **No Visual Drift Rule:** Route moves and shell extraction must preserve current markup structure and all existing Tailwind class tokens.

#### V. Validation & Exit Criteria

- [ ] **[Structural]** `apps/frontend/src/components/ui/Icon.tsx` exists and exports `Icon`.
- [ ] **[Structural]** `apps/frontend/src/components/layout/AppShell.tsx`, `BottomNav.tsx`, `OfflineBanner.tsx`, and `PageHeader.tsx` all exist.
- [ ] **[Boundary]** `apps/frontend/src/app/layout.tsx` is the only layout that renders `<html>` or `<body>`.
- [ ] **[Boundary]** `apps/frontend/src/app/(app)/layout.tsx` preserves the current authenticated redirect behavior from the old protected layout.
- [ ] **[Visual]** `dashboard`, `schedule`, `assignments`, `expenses`, and `chat` page files are moved to `(app)` with no Tailwind class changes.
- [ ] **[Storyboard gap]** `GAP-04` is closed: the codebase now has a shell-level offline pill component instead of relying on page-specific or missing offline UI.

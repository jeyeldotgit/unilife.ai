### FE-S03 - Extract shared UI primitives and feature presentation components

#### I. Meta Specifications
| Field | Value |
|---|---|
| **Spec ID** | FE-S03 |
| **Spec Name** | Extract shared UI primitives and feature presentation components |
| **Responsibility** | Build the reusable UI layer that later page migrations will consume so repeated cards, empty states, and detail surfaces are implemented once and stay storyboard-consistent. |

#### II. System Dependencies & Architectural Context

**Upstream Dependencies** - must be complete before this spec begins:
- `FE-S01` - provides the shared shell, `PageHeader`, and canonical `Icon`.
- `FE-S02` - provides the shared types that UI components must accept as props.
- `apps/frontend/src/lib/types/index.ts` - supplies the data contracts these components render.

**Inputs - Reference Materials** - developer must read before executing:
- `docs/core/STORYBOARD.md § Story 4` - confirm class-block visuals and the class-detail surface expectation.
- `docs/core/STORYBOARD.md § Story 5` - confirm budget card and expense empty-state behavior.
- `docs/core/STORYBOARD.md § Story 8` - confirm assignment reminder display requirements for shared assignment visuals.
- `docs/core/STORYBOARD.md § Story 9` - confirm offline banner should coexist with local page content, not replace it.
- `apps/frontend/src/app/(app)/schedule/page.tsx` - current class block visuals to preserve.
- `apps/frontend/src/app/(app)/assignments/page.tsx` - current assignment card visuals to preserve.
- `apps/frontend/src/app/(app)/expenses/page.tsx` - current budget-card visuals to preserve.
- `apps/frontend/src/app/(app)/chat/page.tsx` - current chat bubble and input visuals to preserve.

#### III. Scope Boundaries

**A. In-Scope**

- `apps/frontend/src/components/ui/BudgetProgressCard.tsx` - CREATE - encapsulate the existing budget summary card visuals and progress treatment.
- `apps/frontend/src/components/ui/AssignmentCard.tsx` - CREATE - encapsulate the assignment card UI for list and chat confirmation usage.
- `apps/frontend/src/components/ui/ClassBlock.tsx` - CREATE - encapsulate the reusable schedule block presentation.
- `apps/frontend/src/components/ui/ClassDetailSheet.tsx` - CREATE - provide the bottom-sheet primitive required by the schedule detail storyboard.
- `apps/frontend/src/components/ui/EmptyState.tsx` - CREATE - provide the shared empty-state presentation for all feature pages.
- `apps/frontend/src/components/chat/ChatBubble.tsx` - CREATE - encapsulate AI and user message bubble rendering.
- `apps/frontend/src/components/chat/ChatInput.tsx` - CREATE - encapsulate the bottom composer UI.
- `apps/frontend/src/components/chat/QuickActions.tsx` - CREATE - encapsulate the reusable quick-action chip group for chat.
- `apps/frontend/src/components/layout/PageHeader.tsx` - MODIFY - support the header variants needed by the migrated feature pages without changing visual output.
- `apps/frontend/src/components/ui/Icon.tsx` - MODIFY - support any required filled/unfilled and size props used by the new shared components.

**B. Out-of-Scope**

- Do not convert route pages to server components in this spec - `FE-S04` through `FE-S06` own route migrations.
- Do not create feature-specific business logic inside shared UI components - they must stay presentation-first.
- Do not add a generic modal system beyond the schedule bottom sheet - only Story 4's class-detail surface is owned here.
- Do not introduce new visual states not already implied by the storyboard or current pages.

#### IV. Technical Delivery Requirements

**A. Artifacts & Deliverables**

| File | Responsibility |
|---|---|
| `apps/frontend/src/components/ui/BudgetProgressCard.tsx` | Exports the shared budget summary card used by dashboard and expenses. |
| `apps/frontend/src/components/ui/AssignmentCard.tsx` | Exports the shared assignment-card renderer used by assignments and chat confirmation UI. |
| `apps/frontend/src/components/ui/ClassBlock.tsx` | Exports the shared class-block renderer for schedule views. |
| `apps/frontend/src/components/ui/ClassDetailSheet.tsx` | Exports the schedule class-detail bottom sheet primitive. |
| `apps/frontend/src/components/ui/EmptyState.tsx` | Exports the shared empty-state renderer used whenever a feature API returns no records. |
| `apps/frontend/src/components/chat/ChatBubble.tsx` | Exports the shared chat-bubble renderer for AI and user messages. |
| `apps/frontend/src/components/chat/ChatInput.tsx` | Exports the shared chat composer UI. |
| `apps/frontend/src/components/chat/QuickActions.tsx` | Exports the reusable quick-action button group. |
| `apps/frontend/src/components/layout/PageHeader.tsx` | Exports the shared protected-page header variants used by later feature migrations. |
| `apps/frontend/src/components/ui/Icon.tsx` | Exports the updated icon wrapper consumed by all shared feature primitives. |

**B. Core Implementation Constraints**

- **Presentation-Only Rule:** Shared UI components accept typed props and callbacks only; they do not fetch data or import from `lib/api/`.
- **Class Fidelity Rule:** When a component is extracted from an existing page, its class strings and inline visual styles must be copied exactly.
- **Shared Empty State Rule:** `EmptyState` must be generic enough to serve dashboard, schedule, assignments, expenses, and chat without page-specific branching inside the component.
- **Bottom Sheet Rule:** `ClassDetailSheet` must be a client component and must support opening from a selected class block without requiring a separate route.
- **No Duplicate Icon Rule:** All icons rendered by these components must come through `components/ui/Icon.tsx`.

#### V. Validation & Exit Criteria

- [ ] **[Structural]** `apps/frontend/src/components/ui/ClassDetailSheet.tsx` exists and exports `ClassDetailSheet`.
- [ ] **[Structural]** `apps/frontend/src/components/ui/EmptyState.tsx` exists and exports `EmptyState`.
- [ ] **[Structural]** `apps/frontend/src/components/chat/ChatBubble.tsx`, `ChatInput.tsx`, and `QuickActions.tsx` all exist.
- [ ] **[Boundary]** No shared UI component imports from `lib/mock/` or `lib/api/`.
- [ ] **[Contract]** All new shared components consume types from `apps/frontend/src/lib/types/index.ts` or simple explicit prop interfaces; none use `any`.
- [ ] **[Storyboard gap]** `GAP-02` is closed: the codebase now has a reusable bottom-sheet primitive for schedule class detail.
- [ ] **[Storyboard gap]** `GAP-05` is closed: the codebase now has one shared `EmptyState` component instead of page-specific ad hoc empty handling.

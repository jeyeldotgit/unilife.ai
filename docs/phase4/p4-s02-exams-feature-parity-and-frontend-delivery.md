# P4-S02 Exams Feature Parity and Frontend Delivery

## I. Meta Specifications

**Spec Name:** P4-S02-exams-feature-parity-and-frontend-delivery  
**Phase:** Phase 4  
**Responsibility:** Deliver exam management end-to-end in the frontend so the product reaches parity with the existing backend/domain support for exams.

## II. System Dependencies & Architectural Context

**Upstream Dependencies:**
- `P4-S01` real backend-backed frontend data integration.
- `P2-S02` academic CRUD foundations for exams.
- Phase 3 shared shell and route patterns.

**Downstream Dependents:**
- `P4-S05` reminder scheduling for exams.
- `P4-S06` planning features that rank upcoming deadlines across assignments and exams.

**Inputs (Reference Materials):**
- `docs/core/PRD.md`
- `docs/core/STORYBOARD.md`
- `docs/core/ENDPOINT_REF.md`
- `packages/types/src/exam.ts`
- `apps/backend/src/routes/exams.route.ts`
- `apps/backend/src/services/exams.service.ts`
- Existing frontend patterns in:
  - `apps/frontend/src/app/(app)/assignments/*`
  - `apps/frontend/src/components/ui/*`

**Resolved Gaps:**
- Exams are part of MVP scope and deadline planning, so they cannot remain backend-only.
- Exams should reuse the Phase 3 route and component architecture rather than introducing a separate UI pattern.

## III. Scope Boundaries

### A. In-Scope Elements

- Exams list route and client companion.
- Exam create, update, and delete flows.
- Exam cards, empty states, and detail surface.
- Real exam API adapter and Server Action wiring.
- Dashboard and chat context updates that include exams as upcoming deadlines where required by existing views.

### B. Out-of-Scope Elements

- Reminder scheduling logic itself, which belongs to `P4-S05`.
- Offline parser support for exam creation from chat, which belongs to `P4-S04`.
- Advanced study tools such as quiz generation or review plans.

## IV. Technical Delivery Requirements

### A. Artifacts & Deliverables to Produce

- `apps/frontend/src/lib/api/exams.ts` - create typed frontend exam adapters.
- `apps/frontend/src/actions/exams.ts` - create root-level exam Server Actions.
- `apps/frontend/src/app/(app)/exams/page.tsx` - create the exams server entry route.
- `apps/frontend/src/app/(app)/exams/ExamsClient.tsx` - create the client companion.
- `apps/frontend/src/components/ui/ExamCard.tsx` - create an exam presentation primitive.
- Any narrow shared types needed under `apps/frontend/src/lib/types` or `packages/types`.

### B. Core Implementation Constraints

- Exams must use the same server-entry plus client-companion pattern used by schedule, assignments, expenses, and chat.
- Mutations must go through `apps/frontend/src/actions/exams.ts`.
- The exams route must preserve the established app-shell language and mobile-first layout patterns rather than introducing a disconnected mini-app.
- Exam data must remain typed and serializable throughout page props and actions.
- Exam dates must be handled consistently in ISO format at the API boundary.
- The exams feature must participate in the same authenticated and offline-aware loading conventions as the rest of the app.

### C. UX Coverage Expectations

At minimum the shipped experience must support:

- Viewing a list of upcoming exams.
- Creating a new exam with title, date/time, optional class link, optional location, and optional description.
- Editing an exam.
- Deleting an exam.
- Seeing relative urgency or countdown labeling in the UI.
- Seeing exams represented in deadline-oriented summaries where the product already aggregates upcoming work.

## V. Validation & Exit Criteria

A successful implementation must verifiably satisfy:

- `/exams` exists and loads real user-specific data from the backend.
- Users can create, edit, and delete exams without leaving the established app flow.
- Exams use the same empty-state quality bar as other feature routes.
- Exam records can be surfaced alongside assignments in deadline-aware contexts.
- `pnpm --filter @unilife-ai/frontend build` succeeds.

## VI. Required Tests

- Build check: `pnpm --filter @unilife-ai/frontend build`.
- Lint check: `pnpm --filter @unilife-ai/frontend lint`.
- Action or adapter coverage for create, update, delete, and list flows.
- Regression coverage that exam data remains serializable through route props.

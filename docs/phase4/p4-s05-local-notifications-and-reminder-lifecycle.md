# P4-S05 Local Notifications and Reminder Lifecycle

## I. Meta Specifications

**Spec Name:** P4-S05-local-notifications-and-reminder-lifecycle  
**Phase:** Phase 4  
**Responsibility:** Implement local reminder scheduling, notification status tracking, and deep-link behavior for classes, assignments, and exams.

## II. System Dependencies & Architectural Context

**Upstream Dependencies:**
- `P4-S02` exams frontend delivery.
- `P4-S03` local persistence and sync reliability.
- Existing assignment, schedule, and exam CRUD flows.

**Downstream Dependents:**
- Student retention and trust in deadline-sensitive flows.
- `P4-S06` daily briefing credibility when reminders already exist in the system.

**Inputs (Reference Materials):**
- `docs/core/PRD.md`
- `docs/core/STORYBOARD.md`
- `docs/core/LLD.md`
- `packages/types/src/notification.ts`
- `packages/shared/src/constants.ts`
- `apps/frontend/src/lib/db/dexie.ts`
- Existing feature routes for assignments, schedule, and exams

**Resolved Gaps:**
- Notifications are part of MVP scope and cannot remain only in documentation and types.
- Reminder scheduling is local-first in the MVP architecture; backend push infrastructure is not required for this phase.
- Notification permission must be additive and must not block students from using the rest of the app.

## III. Scope Boundaries

### A. In-Scope Elements

- Local notification permission request flow.
- Reminder schedule computation for:
  - classes
  - assignments
  - exams
- Notification record persistence in Dexie.
- Reminder rescheduling on create, update, and delete.
- Reminder status transitions such as `pending`, `sent`, and `dismissed`.
- Deep links from notifications into the relevant app surface.
- UI visibility of reminder status on the related detail surface or equivalent contextual UI.

### B. Out-of-Scope Elements

- Remote push notifications.
- Notification center inbox beyond the minimum reminder status visibility required by the storyboard.
- Cross-device reminder sync guarantees.

## IV. Technical Delivery Requirements

### A. Artifacts & Deliverables to Produce

- Notification scheduling helper(s) in the frontend.
- Service worker registration and/or browser notification execution support required by the chosen implementation.
- UI surface(s) for reminder status visibility on assignments and exams, plus class reminder representation where appropriate.
- Any narrow route/detail additions needed for deep-link landing.
- Updates to `apps/frontend/src/lib/db/dexie.ts` only if schema support changes are required.

### B. Core Implementation Constraints

- Reminder offsets must follow the product definitions already documented in the PRD and shared constants.
- Notification scheduling must be idempotent across repeated app loads and repeated edits.
- Deleting or materially rescheduling an entity must cancel or supersede obsolete reminder entries.
- Permission denial must degrade gracefully without breaking CRUD flows.
- Deep-link targets must land the student in a sensible context even if the exact detail surface is implemented as a sheet rather than a full page.
- Local reminders must continue working without requiring the app to be actively open whenever the browser platform allows it.

### C. Coverage Expectations

At minimum the implementation must support:

- Class reminders 30 minutes before start.
- Assignment reminders 7 days, 3 days, 1 day, and 3 hours before due time.
- Exam reminders 14 days, 7 days, 3 days, and 1 day before exam time.
- Visible sent/pending reminder state for assignment and exam contexts.
- Deep-link entry into the corresponding item context after a reminder is tapped.

## V. Validation & Exit Criteria

A successful implementation must verifiably satisfy:

- Creating or editing a class, assignment, or exam produces the correct reminder schedule locally.
- Reminder records are persisted and not duplicated on repeated renders.
- Tapping a reminder opens the app to the relevant context.
- The app remains usable when notification permission is denied.
- `pnpm --filter @unilife-ai/frontend build` succeeds.

## VI. Required Tests

- Build check: `pnpm --filter @unilife-ai/frontend build`.
- Reminder schedule unit tests for class, assignment, and exam offsets.
- Regression coverage for rescheduling and delete cleanup behavior.
- Smoke coverage that permission-denied flows do not break entity CRUD.

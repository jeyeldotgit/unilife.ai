# P5-S02 UI Reliability and Mutation Safety

## I. Meta Specifications

**Spec Name:** P5-S02-ui-reliability-and-mutation-safety  
**Phase:** Phase 5  
**Responsibility:** Establish reusable, accessible UI and mutation safety standards so authenticated features fail visibly, preserve user work, and recover consistently.

## II. System Dependencies & Architectural Context

**Upstream Dependencies:**
- `P5-S01` shared authenticated header and profile behavior.
- `P4-S01` typed online API errors and real data paths.
- `P4-S03` Dexie queue and sync status lifecycle.
- Existing shared UI primitives and feature Server Actions.

**Downstream Dependents:**
- All later Phase 5 feature specs.

**Inputs (Reference Materials):**
- `apps/frontend/src/components/ui/*`
- `apps/frontend/src/actions/*`
- `apps/frontend/src/lib/mutations/local-data.ts`
- `apps/frontend/src/lib/sync/*`
- Existing feature forms, sheets, and route loading/error surfaces

**Resolved Gaps:**
- Shared behavior is required, but each feature remains responsible for domain-specific validation and duplicate criteria.
- Duplicate detection warns and requires acknowledgement; it does not automatically block a legitimate save.
- Immediate delete undo lasts 10 seconds while the underlying record remains soft-deleted afterward.

## III. Scope Boundaries

### A. In-Scope Elements

- Layout-matched loading skeletons for authenticated feature routes.
- Actionable empty states with one primary creation/import/setup action.
- Field-level validation and accessible form summaries.
- Failed-save form-state preservation and retry.
- Optimistic mutation lifecycle with deterministic rollback.
- Typed recoverable errors and user-facing retry behavior.
- Shared likely-duplicate warning contract.
- Shared 10-second delete-undo toast and restoration behavior.
- Keyboard, focus, screen-reader, and narrow-screen requirements.

### B. Out-of-Scope Elements

- Full historical restore/archive browser.
- Automatic merging of duplicate records.
- Replacing the existing sync engine.
- Feature-specific recurrence, AI, finance, or notification behavior owned by later specs.

## IV. Technical Delivery Requirements

### A. Artifacts & Deliverables to Produce

- Shared loading, empty, error, mutation-status, duplicate-warning, and undo-toast primitives.
- A typed recoverable application-error contract consumed by API adapters, actions, and forms.
- Reusable optimistic mutation helpers that capture the previous state, apply the optimistic state, commit on success, and restore on failure.
- Feature-level adoption across dashboard, schedule, assignments, exams, expenses, chat, profile, and settings surfaces.
- Consistent accessibility and responsive-state documentation for shared components.

### B. Recoverable Error Contract

Recoverable mutation failures must expose a stable code, user-safe message, retryability, and optional field errors. Raw backend or provider errors must not be rendered directly.

Forms must preserve entered values and remain open after failed saves. Retrying must not create a duplicate operation or lose the user's edits.

### C. Optimistic Mutation Rules

- Capture the exact previous local state before applying an optimistic change.
- Associate UI state with the mutation or sync queue ID.
- On confirmed success, clear pending UI without creating a second local record.
- On failure, restore the captured state and show a recoverable error.
- A retry reuses the intended logical operation and must not silently duplicate it.
- Never show a mutation as complete before either the online endpoint or sync queue has accepted responsibility for it.

### D. Duplicate And Delete Rules

- Feature adapters return likely duplicate candidates with a human-readable reason.
- The warning allows cancel, review existing record, or save anyway.
- Saving anyway records a distinct intentional operation.
- Delete immediately hides the item optimistically and starts a 10-second undo toast.
- Undo restores the same record identity and cancels or supersedes the pending delete operation.
- After the toast expires, the item remains soft-deleted and is excluded from standard reads.

### E. Accessibility And Responsive Rules

- Dialogs, sheets, menus, warnings, and toasts support keyboard operation and sensible focus restoration.
- Validation errors are associated with inputs and announced to assistive technology.
- Loading skeletons are not announced as real content.
- Empty and error states identify the next available action.
- Shared headers and primary actions remain usable on narrow screens without uncontrolled wrapping.

## V. Validation & Exit Criteria

- Every authenticated feature has explicit loading, empty, recoverable error, and successful-content states.
- Failed saves preserve entered values and permit retry.
- Optimistic failures visibly restore the previous state.
- Repeated retry or reconnect does not create duplicate logical records.
- Likely duplicates require acknowledgement but can be intentionally saved.
- A deleted item can be restored during the 10-second undo window with the same identity.
- Shared interactive components pass keyboard and focus-management checks.
- Route content remains usable at supported mobile widths.

## VI. Required Tests

- Shared component tests for loading, empty, error, duplicate warning, undo toast, keyboard behavior, and focus restoration.
- Mutation integration tests for success, failure rollback, retry, reconnect, and duplicate prevention.
- Delete tests for immediate hide, undo within 10 seconds, toast expiry, and sync queue reconciliation.
- Feature smoke tests proving forms retain values after backend and offline-sync failures.
- Accessibility checks for labels, announcements, focus traps, and menu/dialog operation.
- Frontend build, lint, and test checks.

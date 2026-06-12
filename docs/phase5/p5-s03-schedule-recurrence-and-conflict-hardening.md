# P5-S03 Schedule Recurrence and Conflict Hardening

## I. Meta Specifications

**Spec Name:** P5-S03-schedule-recurrence-and-conflict-hardening  
**Phase:** Phase 5  
**Responsibility:** Make academic planning represent a complete student week and add a shared recurrence-series, occurrence, exception, and conflict-warning model.

## II. System Dependencies & Architectural Context

**Upstream Dependencies:**
- `P5-S01` timezone-aware user profile.
- `P5-S02` duplicate warning and mutation recovery standards.
- `P4-S03` offline queue and reconnect reconciliation.
- Existing academic REST, Dexie, notification, and selector behavior.

**Downstream Dependents:**
- `P5-S04` AI proposals for recurring academic records.
- `P5-S05` recurring expenses reuse the recurrence contracts.
- `P5-S06` notification materialization and sync recovery.
- `P5-F01` schedule imports.

**Inputs (Reference Materials):**
- `packages/types/src/class.ts`
- `packages/types/src/assignment.ts`
- `apps/frontend/src/lib/selectors/schedule.ts`
- `apps/frontend/src/lib/notifications/schedule.ts`
- `apps/frontend/src/lib/sync/*`
- Academic backend routes, services, and repositories

**Resolved Gaps:**
- The schedule is a fixed Monday-first seven-day experience.
- Recurrence uses a series-plus-materialized-occurrences model.
- Existing class rows remain valid and are migrated without data loss.
- Overlaps warn but do not block saves.
- Tasks are represented by the existing assignment domain.

## III. Scope Boundaries

### A. In-Scope Elements

- Seven-day schedule with weekend support and current-day highlighting.
- Optional hiding of empty days.
- Overnight entry rendering across both affected days.
- Academic overlap/conflict detection and warning UI.
- Recurrence support for classes and assignments.
- Daily, weekdays, weekly, and custom-weekday recurrence options.
- Single occurrence, this-and-future, and entire-series editing.
- Explicit holiday/calendar exclusion support.
- Recurrence series, occurrences, exceptions, revision metadata, and sync contracts.

### B. Out-of-Scope Elements

- Automated school calendar or public-holiday inference.
- University/LMS calendar synchronization.
- Blocking students from saving schedule conflicts.
- AI schedule file import, owned by `P5-F01`.
- Advanced RFC 5545 recurrence beyond the supported product options.

## IV. Technical Delivery Requirements

### A. Artifacts & Deliverables to Produce

- Shared recurrence-series, occurrence, exception, and edit-scope types.
- Database migrations and backend REST/repository/service support for recurrence persistence.
- Dexie schema and sync entity extensions for recurrence data.
- Seven-day schedule selectors and UI.
- Conflict detection shared by manual writes, AI proposals, and future imports.
- Recurrence-aware notification materialization.
- A compatibility migration for existing classes and assignments.

### B. Recurrence Contracts

A recurrence series must define:

```ts
type RecurrenceFrequency = "daily" | "weekly";
type RecurrenceEditScope = "occurrence" | "future" | "series";

type RecurrenceSeries = {
  id: string;
  user_id: string;
  entity_type: "class" | "assignment" | "expense";
  frequency: RecurrenceFrequency;
  interval: number;
  weekdays: DayOfWeek[];
  timezone: string;
  starts_at: string;
  ends_at: string | null;
  revision: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};
```

Occurrences link to a series and store their effective start/end, source revision, domain record identity, and cancellation/deletion state. Exceptions store changes or cancellations for a specific original occurrence time so regeneration does not overwrite them.

### C. Materialization And Editing Rules

- Materialize occurrences within a rolling horizon sufficient for schedule views and reminder scheduling; the implementation must document and centralize the horizon.
- Re-running materialization is idempotent.
- `occurrence` edits create or update an exception without changing sibling occurrences.
- `future` edits end the original series before the selected occurrence and create a successor series.
- `series` edits increment the series revision and regenerate only unaffected occurrences.
- Existing standalone academic records remain standalone unless the user explicitly converts them or a migration safely wraps them as one-item series.
- Holiday exclusions apply only from user-configured or explicitly imported calendar dates.

### D. Schedule And Conflict Rules

- Week columns are Monday through Sunday and all seven render by default.
- Users may hide empty days without changing stored data.
- Current-day highlighting uses the resolved user timezone.
- An overnight record is visually represented on both affected days while retaining one logical occurrence.
- Conflict detection compares effective occurrence intervals and reports all overlaps.
- Conflicts present affected subjects/titles and times, but saving remains available after acknowledgement.

### E. Sync And Revision Rules

- Extend sync entity contracts to support recurrence series, occurrences, and exceptions.
- Offline recurrence edits enqueue deterministic operations and survive reconnect.
- Last-write-wins remains the merge policy, using `updated_at` plus revision metadata.
- Replaced revisions remain identifiable so `P5-S06` can surface recovery information.
- Notification regeneration must not duplicate reminders after series edits or reconnects.

## V. Validation & Exit Criteria

- Schedule renders Monday through Sunday and supports hiding empty days.
- Weekend and overnight entries render correctly in the user's timezone.
- Overlapping entries display a warning and can still be saved intentionally.
- Daily, weekdays, weekly, and custom-weekday series materialize correctly.
- Occurrence, future, and entire-series edits affect only their selected scope.
- Exceptions survive regeneration, reload, offline use, and reconnect.
- Existing classes and assignments remain visible after migration.
- Repeated materialization and sync do not duplicate occurrences or notifications.

## VI. Required Tests

- Recurrence unit tests for each supported frequency, weekday set, boundary, timezone, and end condition.
- Editing tests for occurrence, future, and series scopes.
- Materialization idempotency, exception preservation, and revision tests.
- Schedule selector tests for seven days, weekends, overnight entries, empty-day hiding, and current-day highlighting.
- Conflict tests for touching intervals, true overlaps, overnight overlaps, and acknowledged saves.
- Offline/reconnect integration tests for recurrence operations and notification regeneration.
- Migration regression tests for existing academic records.
- Frontend and backend build, lint, and test checks.

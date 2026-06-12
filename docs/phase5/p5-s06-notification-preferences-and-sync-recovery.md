# P5-S06 Notification Preferences and Sync Recovery

## I. Meta Specifications

**Spec Name:** P5-S06-notification-preferences-and-sync-recovery  
**Phase:** Phase 5  
**Responsibility:** Extend the existing local reminder and sync systems with user preferences, quiet hours, bounded escalation, clear mutation status, and recoverable last-write-wins outcomes.

## II. System Dependencies & Architectural Context

**Upstream Dependencies:**
- `P5-S01` user timezone and profile settings.
- `P5-S02` mutation status and recoverable error standards.
- `P5-S03` recurrence revisions and notification materialization.
- `P5-S05` budget alerts and recurring expenses.
- `P4-S03` sync queue and reconnect reconciliation.
- `P4-S05` local notification runtime and reminder lifecycle.

**Inputs (Reference Materials):**
- `apps/frontend/src/lib/sync/*`
- `apps/frontend/src/lib/notifications/*`
- `apps/frontend/src/lib/db/dexie.ts`
- `packages/types/src/notification.ts`
- `packages/types/src/sync-queue.ts`
- Existing notification and sync Phase 4 specs

**Resolved Gaps:**
- Phase 5 extends the existing sync queue and reminder runtime; it does not create replacements.
- Notification preferences cover classes, assignments, exams, budget alerts, and daily briefings.
- Default quiet hours are 10 PM to 7 AM in the user's timezone.
- Nothing bypasses quiet hours unless the user explicitly enables urgent bypass for that category.
- Escalation is capped at three reminders per item.

## III. Scope Boundaries

### A. In-Scope Elements

- Persisted per-category notification preferences.
- Quiet hours, explicit category urgent bypass, and bounded escalation.
- Budget-alert and daily-briefing notification categories.
- Timezone-aware queued delivery after quiet hours.
- Visible pending, syncing, synced, and failed mutation states.
- Retry and recovery controls for failed sync items.
- Preservation of local drafts and pending operations through reconnect.
- Recoverable revision information for last-write-wins replacement.
- Recurrence-aware notification idempotency.

### B. Out-of-Scope Elements

- Remote push notification infrastructure.
- Guaranteed background delivery beyond browser/platform capability.
- Replacing Dexie, the existing sync endpoint, or the reminder runtime.
- Automatic conflict merging.
- Cross-device notification-delivery guarantees.

## IV. Technical Delivery Requirements

### A. Artifacts & Deliverables to Produce

- User-scoped notification-preference persistence, REST contracts, shared types, and settings UI.
- Extensions to notification category and scheduling contracts.
- Quiet-hour and escalation evaluation in the existing reminder runtime.
- Mutation/sync status indicators and failed-operation recovery surfaces.
- Revision metadata and recovery snapshots sufficient to explain last-write-wins replacement.
- Recurrence-aware reminder reconciliation.

### B. Preference Contract

Preferences must support:

```ts
type NotificationCategory =
  | "class"
  | "assignment"
  | "exam"
  | "budget_alert"
  | "daily_briefing";

type NotificationPreference = {
  category: NotificationCategory;
  enabled: boolean;
  urgent_bypass_enabled: boolean;
  escalation_limit: number;
};
```

User settings also store `quiet_hours_enabled`, `quiet_hours_start`, and `quiet_hours_end`. Defaults are enabled, `22:00`, and `07:00`. Escalation limits validate from zero to three and default to three.

### C. Notification Rules

- Permission denial never blocks entity CRUD, finance tracking, daily briefing, or settings access.
- Disabled categories do not schedule new reminders and cancel pending reminders for that category.
- During quiet hours, due notifications remain queued and are delivered after quiet hours if still relevant.
- A category may bypass quiet hours only when its explicit urgent-bypass setting is enabled.
- No logical item may generate more than its configured escalation limit.
- Reconciliation after series changes, timezone changes, app restart, or reconnect is idempotent.
- Obsolete, completed, deleted, or superseded reminders do not fire.

### D. Sync Status And Recovery Rules

- Surface `pending`, `syncing`, `synced`, and `failed` states without blocking normal navigation.
- Failed queue items expose retry and failure details; one failed item never blocks later items.
- Local drafts and accepted pending operations remain available after reload and reconnect.
- Retry reuses the same logical mutation identity.
- Last-write-wins remains authoritative, but a replaced local revision retains a user-reviewable recovery snapshot and replacement reason.
- Recovery never silently overwrites the winning remote revision; restoring a snapshot creates a new explicit mutation.

## V. Validation & Exit Criteria

- Users can configure all five notification categories independently.
- Default quiet hours resolve as 10 PM to 7 AM in the user's timezone.
- Quiet-hour notifications queue correctly, and no category bypasses without explicit opt-in.
- Escalation never exceeds three reminders per item or the user's lower configured limit.
- Permission denial leaves all non-notification workflows usable.
- Notification reconciliation remains duplicate-free after recurrence and timezone changes.
- Mutation status is visible and failed operations are retryable.
- Reconnect preserves drafts and pending operations.
- Last-write-wins replacements expose recoverable revision information without silently restoring it.

## VI. Required Tests

- Preference endpoint tests for auth, user scoping, defaults, validation, and updates.
- Quiet-hour tests for same-day and overnight ranges, timezone changes, queued delivery, and urgent bypass.
- Escalation tests for zero through three limits and repeated reconciliation.
- Notification idempotency tests after recurrence edits, deletion, completion, restart, and reconnect.
- Permission-denied regression tests.
- Sync integration tests for status transitions, mixed success/failure, retry identity, reload, reconnect, and non-blocking failures.
- Revision-recovery tests for last-write-wins replacements and explicit restoration mutations.
- Frontend and backend build, lint, and test checks.

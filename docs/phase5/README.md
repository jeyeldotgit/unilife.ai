# Phase 5 Product Hardening Specs

This directory contains the Phase 5 implementation specs for UniLife.AI.

Phase 5 hardens the product for release by removing untrustworthy personalization, standardizing recovery behavior, extending the academic and finance models for real student use, and making AI-originated changes explicitly reviewable. It extends the Phase 4 offline sync and notification systems rather than replacing them.

## Spec Index

- `P5-S01` - Establish trustworthy user identity, avatar management, and a consistent authenticated app header
- `P5-S02` - Standardize loading, empty, error, duplicate, optimistic mutation, and delete-undo behavior
- `P5-S03` - Deliver a seven-day schedule, recurrence series, occurrence editing, and conflict warnings
- `P5-S04` - Require review for AI actions and add action history plus guarded undo
- `P5-S05` - Harden budgets and expenses with daily budgets, revisions, filters, refunds, and recurrence
- `P5-S06` - Add notification preferences and strengthen sync visibility and recovery
- `P5-F01` - Define the future AI-assisted image, PDF, and ICS schedule-import workflow; this is not an implementation spec

## Files

- [p5-s01-user-identity-avatar-and-app-shell-hardening.md](./p5-s01-user-identity-avatar-and-app-shell-hardening.md)
- [p5-s02-ui-reliability-and-mutation-safety.md](./p5-s02-ui-reliability-and-mutation-safety.md)
- [p5-s03-schedule-recurrence-and-conflict-hardening.md](./p5-s03-schedule-recurrence-and-conflict-hardening.md)
- [p5-s04-ai-action-review-history-and-undo.md](./p5-s04-ai-action-review-history-and-undo.md)
- [p5-s05-budget-and-expense-hardening.md](./p5-s05-budget-and-expense-hardening.md)
- [p5-s06-notification-preferences-and-sync-recovery.md](./p5-s06-notification-preferences-and-sync-recovery.md)
- [p5-f01-ai-schedule-import.md](./p5-f01-ai-schedule-import.md)

## Dependency And Delivery Order

1. **Identity and UI reliability:** Complete `P5-S01`, then `P5-S02`.
2. **Academic and AI safety:** Complete `P5-S03`, then `P5-S04`.
3. **Finance, notifications, and sync recovery:** Complete `P5-S05`, then `P5-S06`.
4. **Future work:** `P5-F01` may be implemented only after `P5-S03` and `P5-S04` contracts are stable.

Each implementation spec must remain independently reviewable and releasable. A spec may be delivered through multiple pull requests, but its exit criteria must be satisfied before the next dependent spec is considered complete.

## Global Constraints

**Trustworthy authenticated identity.** `public.users.display_name` is the only source of truth for names shown on authenticated product surfaces. Fictional names may remain only in clearly marked marketing examples.

**Monday-first complete week.** Schedule experiences use a fixed Monday-first seven-day week. Weekend schedules are first-class data.

**Existing application architecture remains authoritative.** REST remains the backend application surface, Server Actions remain the default online mutation entry, Dexie remains the local-first cache and queue layer, and the existing sync engine remains responsible for reconnect reconciliation.

**Phase 4 compatibility is mandatory.** Phase 5 extends `P4-S03` sync and `P4-S05` notifications. It must not create parallel sync queues, reminder runtimes, or alternate persistence paths.

**All AI writes require confirmation.** No confidence threshold may bypass user review for AI-proposed create, update, or delete operations.

**PHP remains the only displayed currency.**

**User-local time is explicit.** User-facing greetings, date filters, quiet hours, recurrence, and "today" calculations use the user's valid IANA timezone, falling back to the device timezone when no saved value exists.

**Failure must remain visible and recoverable.** Mutations, synchronization, and AI proposals must never silently disappear, duplicate, or overwrite later user work.

## Hardening Gap Matrix

| Gap ID | Description | Closed by |
| --- | --- | --- |
| `P5-G01` | Authenticated routes show inconsistent headings, hardcoded names, or non-user avatars | `P5-S01` |
| `P5-G02` | Onboarding and profile settings do not provide a complete avatar workflow | `P5-S01` |
| `P5-G03` | Loading, empty, validation, failed-save, duplicate, and delete recovery behavior is inconsistent | `P5-S02` |
| `P5-G04` | Schedule presentation is weekday-only and does not reliably represent overnight or conflicting classes | `P5-S03` |
| `P5-G05` | Recurring classes, assignments, and expenses lack a shared series and occurrence contract | `P5-S03`, `P5-S05` |
| `P5-G06` | AI-originated high-confidence actions may save without explicit review and lack guarded undo | `P5-S04` |
| `P5-G07` | Budget periods, revision history, expense filtering, and refund representation are incomplete | `P5-S05` |
| `P5-G08` | Notification preferences, quiet hours, escalation limits, and sync recovery visibility are incomplete | `P5-S06` |
| `P5-G09` | Students cannot safely import image, PDF, or ICS schedules through a review-first workflow | `P5-F01` future work |

## Cross-Spec Exit Criteria

- No authenticated route displays "Alex" unless the authenticated user's `display_name` is Alex.
- Missing profile data resolves to a stable generic greeting and initials/avatar fallback.
- Failed optimistic mutations roll back visibly and preserve entered form data.
- Soft-deleted records can be restored from the immediate 10-second undo action.
- Weekend, overnight, recurring, and overlapping schedule entries render predictably.
- AI actions cannot modify domain data before explicit confirmation.
- AI undo cannot overwrite a record changed after the AI action.
- Budget revisions preserve prior values, and refunds preserve their original expenses.
- Quiet hours and date-sensitive behavior use the resolved user timezone.
- Failed offline mutations remain visible, retryable, and recoverable.

## Explicitly Deferred Product Areas

Phase 5 does not implement account deletion, user data export, grade forecasting, advanced financial insights, attendance analytics, remote push infrastructure, or university/LMS integrations.

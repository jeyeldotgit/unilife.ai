# P6-S01 UX Bugs and Product Polish

## I. Meta Specifications

**Spec Name:** P6-S01-ux-bugs-and-product-polish
**Phase:** Phase 6
**Responsibility:** Resolve thirteen user-reported UX defects and product inconsistencies spanning chat confirmation flow, AI action review card presentation, sync status notifications, settings organization, notification bell behavior, schedule layout, assignment completion, expense/budget UI and logic, exam form submission, dashboard interactivity, and chat quick actions.

---

## II. System Dependencies & Architectural Context

**Upstream Dependencies:**

- `P5-S04` AI action review history and undo — this spec amends confirmation scope rules introduced there.
- `P5-S05` budget and expense hardening — this spec resolves budget cycle UX gaps that were left incomplete.
- `P5-S06` notification preferences and sync recovery — this spec separates those settings from `/profile` and corrects the notification bell.
- `P4-S06` daily briefing, free-time, and allowance planning — this spec fixes dashboard card interactivity and budget estimation logic.
- `P4-S03` Dexie sync engine — this spec changes how sync status feedback is surfaced.
- `P4-S02` exams feature parity — this spec fixes the missing submit button on the exam form.

**Downstream Dependents:**

- Any future planning or AI feature that relies on correct budget cycle arithmetic.
- Any future notification center built on the bell component.

**Inputs (Reference Materials):**

- `docs/core/STORYBOARD.md` — Stories 1–10 for intent reference on each affected surface.
- `docs/core/PRD.md § FR-007, FR-009, FR-010, FR-011` — daily briefing, budget, allowance forecast, and notification requirements.
- `docs/core/LLD.md § 6.7` — sync engine behavior.
- `p5-s04-ai-action-review-history-and-undo.md`
- `p5-s05-budget-and-expense-hardening.md`
- `p5-s06-notification-preferences-and-sync-recovery.md`
- `p4-s06-daily-briefing-free-time-and-allowance-planning.md`

**Resolved Gaps:**

- Issue 1: Confirmation is required for **all** AI writes per P5-S04. This spec narrows that rule: expense logging is auto-confirmed; class and exam creation remain confirmation-required; assignment creation is auto-confirmed. The spec documents the rationale.
- Issue 5: `/profile` currently mixes identity settings with notification preferences and sync history. These must be split into separate settings sections.
- Issue 11c: Budget "Est. lasts N more days" uses total budget ÷ 1, producing nonsense when no expenses exist. The calculation must use average daily spend, defaulting to a sensible first-cycle heuristic.
- Issue 12: Budget cycle self-renewal is not yet implemented; the `start_date`/`end_date` model requires automatic rollover logic driven by `period`.

---

## III. Scope Boundaries

### A. In-Scope Elements

All thirteen issues below are in scope for this spec:

1. Chat confirmation scope — selective, not universal.
2. AI action review card — presentation quality and field completeness.
3. AI action review card — ID/timestamp exposure and raw field leakage.
4. Sync status feedback — transient in-app notification + bell history.
5. Settings page — split notification preferences and sync history out of `/profile`.
6. Notification bell — make it a real notification drawer.
7. Schedule calendar UI — mobile layout density and readability.
8. Assignment completion toggle — must actually mark the record done.
9. Expenses page — budget setup and log expense button placement.
10. Exam form — missing submit button.
11. Dashboard quick actions — class detail on tap, deadline card navigation, budget estimation.
12. Budget cycle logic — automatic period rollover, hardened budget UI, category breakdown.
13. Chat quick actions — add "Add Exam" quick action.

### B. Out-of-Scope Elements

- Full notification center inbox redesign beyond the bell drawer described here.
- Recurring expense or recurring class implementation (owned by P5-S03/P5-S05).
- AI undo behavior changes (owned by P5-S04).
- Schedule recurrence (owned by P5-S03).
- Any new backend endpoints not explicitly required by the fixes below.

---

## IV. Issue-by-Issue Technical Requirements

---

### Issue 1 — Chat Confirmation: Selective, Not Universal

**Problem:** Every AI action currently requires confirmation. Expense logging (`log_expense`) is a fast, high-frequency action; forcing a confirmation step before "lunch 85" is logged breaks the flow described in Storyboard Story 5.

**Decision and Rationale:**

| Intent                | Confirmation Required | Rationale                                                                                                                  |
| --------------------- | --------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `log_expense`         | No — auto-confirm     | Low stakes, high frequency, immediately reversible via delete. Storyboard Story 5 expects instant feedback.                |
| `create_assignment`   | No — auto-confirm     | Fast capture is the core value. User can edit or delete immediately after.                                                 |
| `create_class`        | Yes                   | Recurring schedule impact; errors propagate to every week. Story 7 explicitly includes a "Tama ba ito?" confirmation step. |
| `create_exam`         | Yes                   | High-stakes deadline with reminder scheduling side effects.                                                                |
| `update_*`            | Yes                   | Overwrites existing data; user must see what changes.                                                                      |
| `delete_*`            | Yes                   | Destructive.                                                                                                               |
| `query_*` / read-only | No                    | No write occurs.                                                                                                           |

**Implementation Requirements:**

- The chat action handler must inspect `intent` before deciding whether to route through the confirmation card or directly apply the action.
- Auto-confirmed intents must still show a **result bubble** (not a confirmation card) that displays what was created, with a single "Undo" affordance visible for 10 seconds (reusing the P5-S02 delete-undo pattern).
- The `requires_confirmation` flag returned by the backend AI endpoint must be respected as a **minimum floor**: if the backend returns `requires_confirmation: true` for an intent that this spec marks as auto-confirm, the frontend still shows confirmation. The override only applies in the other direction (auto-confirming intents the spec permits).
- The parser package (`packages/parser`) must apply the same intent → confirmation mapping for offline-executed intents.

**Artifacts to Modify:**

- `apps/frontend/src/lib/chat/chat-executor.ts` (or equivalent execution file)
- `apps/frontend/src/app/(app)/chat/ChatClient.tsx`
- `packages/parser/src/intent-router.ts`

---

### Issue 2 — AI Action Review Card: Presentation Quality and Field Completeness

**Problem:** The confirmation card exposes backend intent names (`create_assignment`, `create_class`) as visible labels, presents an incomplete field set (missing class linkage selector for assignments, etc.), and feels visually underdeveloped.

**Renamed Labels (UI copy only, not API contract changes):**

| Backend `intent`                    | Card Heading      |
| ----------------------------------- | ----------------- |
| `create_assignment`                 | Add Assignment    |
| `create_class`                      | Add Class         |
| `create_exam`                       | Add Exam          |
| `log_expense`                       | Log Expense       |
| `update_assignment`                 | Update Assignment |
| `delete_assignment`                 | Remove Assignment |
| _(same pattern for other entities)_ |                   |

**Required Fields Per Intent:**

**`create_assignment` card:**

- Title (editable text input)
- Due date + time (editable date-time picker, formatted as "Friday, June 20 · 11:59 PM")
- Link to class (optional dropdown, populated from user's classes; shows "No class linked" if unset)
- Priority (Low / Medium / High selector, defaulting to Medium)

**`create_class` card:**

- Subject name (editable)
- Day(s) of week (multi-select chips: Mon Tue Wed Thu Fri Sat Sun)
- Start time + End time (editable, formatted as "10:00 AM – 11:30 AM")
- Room (optional editable)
- Instructor (optional editable)

**`create_exam` card:**

- Title (editable)
- Exam date + time (editable, human-readable format)
- Link to class (optional dropdown)
- Location (optional editable)

**`log_expense` card (result bubble, not confirmation — see Issue 1):**

- Amount with ₱ symbol
- Category (with emoji icon matching the category)
- Description (if extracted)
- Budget remaining after this expense

**General Card Requirements:**

- Uncertain fields (those returned in `uncertain_fields` from the AI response) must be visually marked with a subtle "?" or amber underline so the user knows to verify them.
- The card must have two actions: **Save** (primary) and **Cancel** (ghost/outline). No "Confirm" or "Apply" — use "Save."
- Card must be rendered as a chat bubble originating from the AI side, not a modal or bottom sheet, to preserve conversational flow.

**Artifacts to Modify:**

- `apps/frontend/src/components/chat/ActionReviewCard.tsx` (create if not present, modify if present)
- `apps/frontend/src/lib/types/index.ts` — add `displayLabel` mapping or utility for intent names

---

### Issue 3 — AI Action Review Card: Stop Exposing Internal IDs and Raw Timestamps

**Problem:** The review card surfaces raw UUIDs (e.g. `class_id: "a3f7..."`) and raw ISO 8601 timestamps (`2026-06-20T05:30:00.000Z`) directly to the user.

**Requirements:**

- **IDs must never appear in the review card.** Class linkage must show the class subject name (e.g. "Biology"), resolved by looking up the `class_id` against the local Dexie `classes` table. If the class cannot be resolved, show "Unknown class" with an amber warning.
- **All timestamps must be formatted before display.** Use a consistent human-readable format throughout the app:
  - Date + time: `Friday, June 20 · 11:59 PM`
  - Date only: `Friday, June 20`
  - Time only: `10:00 AM`
  - Relative (within 7 days): `in 3 days` (supplementary, not a replacement)
- **A shared date formatting utility** must be created or extended at `packages/shared/src/date.ts` and consumed everywhere dates are rendered — review cards, assignment cards, exam cards, dashboard deadline cards. No page or component should inline `new Date(...).toISOString()` or raw timestamp strings in user-visible text.

**Artifacts to Modify:**

- `packages/shared/src/date.ts` — add `formatDateTime`, `formatDate`, `formatTime`, `formatRelative` exports
- `apps/frontend/src/components/chat/ActionReviewCard.tsx`
- Any other component currently rendering raw ISO strings

---

### Issue 4 — Sync Status: Transient In-App Notification + Bell History

**Problem:** Every CRUD operation's sync status banner is persistent and only clears when the next action is taken. This creates visual clutter and poor UX.

**New Behavior:**

- Sync status feedback must be a **transient toast** that auto-dismisses after **3 seconds** on success.
- The toast appears at the top of the screen (below the header) as a subtle pill, consistent with the existing `OfflineBanner` visual language.

**Toast States:**

| State            | Appearance                               | Duration                              |
| ---------------- | ---------------------------------------- | ------------------------------------- |
| Syncing          | Neutral pill: "Saving…"                  | Until resolved                        |
| Synced (success) | Green pill: "Saved"                      | 3 seconds, then dismiss               |
| Failed           | Red pill: "Couldn't save — tap to retry" | Persistent until retried or dismissed |

- **Failed sync items must also be stored in the notification bell** (see Issue 6) so the user can review and retry them later even after the toast has dismissed.
- The `sync-engine.ts` must emit events that the toast system subscribes to; the toast must not poll Dexie directly.
- Only one toast is visible at a time. If multiple sync operations complete in rapid succession, only the latest status is shown (or "Saved 3 items" if batched).

**Artifacts to Modify:**

- `apps/frontend/src/lib/sync/sync-engine.ts` — emit `sync:success`, `sync:failed`, `sync:pending` events
- `apps/frontend/src/components/layout/SyncToast.tsx` — create
- `apps/frontend/src/components/layout/AppShell.tsx` — mount `SyncToast`

---

### Issue 5 — Settings: Split Notification Preferences and Sync History Out of `/profile`

**Problem:** `/profile` is conflating user identity settings with operational settings (notification preferences, sync history). These are different mental models for the user.

**New Settings Architecture:**

Create a `/settings` route group under `(app)` with the following structure:

```
/settings                    — Settings index / landing
/settings/notifications      — Notification preferences (moved from /profile)
/settings/sync               — Sync history and failed operation recovery (moved from /profile)
/settings/account            — Account details, display name, avatar, timezone (the identity content that was already in /profile)
```

`/profile` should either redirect to `/settings/account` or be removed. The bottom nav "Profile" tab (if present) should link to `/settings/account`.

**`/settings/notifications` content:**

- All per-category toggles (Classes, Assignments, Exams, Budget Alerts, Daily Briefing)
- Quiet hours configuration
- Escalation limit per category
- This content is currently specified in P5-S06 but was shipped in the wrong location.

**`/settings/sync` content:**

- List of pending and failed sync queue items
- Per-item retry button
- Per-item dismiss/acknowledge button
- Clear-all-failed button
- This content is currently specified in P5-S06 but was shipped in the wrong location.

**`/settings/account` content:**

- Display name
- Avatar (preset selector + upload)
- Email (read-only)
- Timezone picker
- Logout

**Navigation:**

- The header avatar menu should show: "Account Settings", "Notifications", "Sync Status", separator, "Log Out".
- Settings pages use the same `AppShell` and `PageHeader` as other authenticated routes.

**Artifacts to Create/Modify:**

- `apps/frontend/src/app/(app)/settings/page.tsx`
- `apps/frontend/src/app/(app)/settings/notifications/page.tsx`
- `apps/frontend/src/app/(app)/settings/sync/page.tsx`
- `apps/frontend/src/app/(app)/settings/account/page.tsx`
- `apps/frontend/src/app/(app)/profile/page.tsx` — redirect to `/settings/account`
- `apps/frontend/src/components/layout/AppShell.tsx` — update avatar menu links

---

### Issue 6 — Notification Bell: Real Notification Drawer

**Problem:** The bell icon in the header currently only signals whether browser notification permission has been granted. It is not a functional notification center.

**New Behavior:**

The bell must open a **slide-in drawer or dropdown panel** (mobile: full-width bottom-anchored panel; desktop: top-right dropdown) containing:

**Notification categories displayed in the bell:**

1. **Reminders** — upcoming class, assignment, and exam reminders that have been sent or are pending. These mirror what the device has already pushed as browser notifications, so the user can review them in-app.
2. **Sync failures** — failed sync operations (mirroring `/settings/sync` but surfaced inline for urgency). Each item shows entity type, what failed, and a Retry button.
3. **AI action results** — auto-confirmed expense logs and assignments that were saved without a confirmation step show here so the user knows what was created. These auto-dismiss from the bell after 24 hours.

**Bell badge behavior:**

- Show a red dot badge when there are unread items (new reminders, new sync failures, new AI results).
- Badge clears when the drawer is opened.
- If notifications permission is denied, the bell still opens the drawer but shows a "Enable notifications to receive reminders" prompt at the top, along with the sync failures and AI result sections (which do not require permission).

**Artifacts to Create/Modify:**

- `apps/frontend/src/components/layout/NotificationDrawer.tsx` — create
- `apps/frontend/src/components/layout/AppShell.tsx` or `PageHeader.tsx` — wire bell to drawer
- `apps/frontend/src/lib/db/dexie.ts` — add `bell_items` table or extend `notifications` with `bell_read` flag

---

### Issue 7 — Schedule Calendar: Mobile Layout Density

**Problem:** The weekly schedule grid is too dense and cramped on mobile screens, making class blocks hard to read and tap.

**Required Changes:**

- **Default to a single-day view on screens narrower than 640px.** Show a day selector (tab bar or horizontal scroll strip of abbreviated day names: M T W T F S S) at the top. The currently selected day renders full-width with comfortable time slots.
- **The 7-day grid view remains available on wider screens** (≥640px) and can be accessed on mobile via a "Week" toggle in the page header area.
- **Time slot height** must be at minimum 48px per hour on mobile single-day view to ensure class blocks are tappable (minimum 44×44px touch target per WCAG 2.5.5).
- **Class block text** must truncate with ellipsis at one line for subject name and show room on a second line only if it fits. Never overflow the block.
- **The "+ Add Class" button** on mobile must be a FAB (floating action button) anchored bottom-right, consistent with the expenses page FAB pattern, not an inline text link inside the grid.
- The day-view / week-view state must be persisted in `localStorage` so it survives navigation.

**Artifacts to Modify:**

- `apps/frontend/src/app/(app)/schedule/ScheduleClient.tsx`
- `apps/frontend/src/components/ui/ClassBlock.tsx`
- `apps/frontend/src/components/ui/WeeklyGrid.tsx` (create if not present, extract from ScheduleClient)

---

### Issue 8 — Assignment Completion Toggle: Actually Mark as Done

**Problem:** Tapping the completion toggle on the assignments page does not persist the status change.

**Root Cause to Investigate:**
The toggle likely updates local UI state without calling the assignment update action or writing to Dexie. The fix must go through the full mutation path.

**Required Fix:**

- Tapping the toggle must call the `updateAssignment` action with `{ status: "completed" }` (or `"pending"` to uncheck).
- The update must write to Dexie immediately (optimistic) and enqueue a sync item.
- The assignment card must reflect the new status immediately (strike-through title, muted color, checked circle) without waiting for the sync confirmation.
- If the update fails, the toggle must revert to its previous state and show a recoverable error toast (reusing the P5-S02 pattern).
- A completed assignment must move to the "Done" filter tab automatically. If the user is viewing "All", it stays visible but with the completed visual treatment.

**Artifacts to Modify:**

- `apps/frontend/src/app/(app)/assignments/AssignmentsClient.tsx`
- `apps/frontend/src/components/ui/AssignmentCard.tsx`
- `apps/frontend/src/actions/assignments.ts`

---

### Issue 9 — Expenses Page: Budget Setup and Log Expense Button Placement

**Problem:** The "Set Budget" and "Log Expense" buttons are placed in a way that disrupts the visual calm of the expenses page. Their current position likely interrupts the reading flow of the spending summary.

**Proposed Layout Restructure:**

```
┌─────────────────────────────────┐
│  💰 Expenses          [+] FAB   │  ← Log Expense as FAB bottom-right
│─────────────────────────────────│
│  ┌─────────────────────────┐    │
│  │  Budget Card             │    │  ← Compact, collapsible
│  │  ₱ 1,155 / ₱ 1,500 ···  │    │
│  │  ▓▓▓▓▓▓▓▓▓▓░░░  77%     │    │
│  │  [Edit Budget]           │    │  ← Inline text button, not a CTA
│  └─────────────────────────┘    │
│                                  │
│  Category Breakdown              │
│  (bar or donut, full-width)      │
│                                  │
│  Recent Expenses                 │
│  [list of expense rows]          │
│                                  │
│  (no budget set state:)          │
│  ┌─────────────────────────┐    │
│  │  No budget set yet       │    │
│  │  [Set up your budget →]  │    │  ← EmptyState component, not a button in the chrome
│  └─────────────────────────┘    │
│                                  │
└─────────────────────────────────┘
```

**Specific Changes:**

- **"Log Expense"** becomes a FAB (floating action button) in the bottom-right corner, consistent with how the schedule will handle "Add Class." Icon: a `+` or `add` Material Symbol.
- **"Set Budget" / "Edit Budget"** is an inline text link inside the budget card, not a standalone primary button. It opens a bottom sheet or modal for budget configuration, not a new route.
- **When no budget exists**, show the budget card area as an `EmptyState`-style component with a single "Set up your budget" call to action centered in the card area.
- **Category breakdown** must always show all five categories including those at 0%, to give a consistent layout (not a dynamic list that jumps around as spending changes). The "Miscellaneous" category must always show its percentage even if 0%.

**Artifacts to Modify:**

- `apps/frontend/src/app/(app)/expenses/ExpensesClient.tsx`
- `apps/frontend/src/app/(app)/expenses/page.tsx`
- `apps/frontend/src/components/ui/BudgetProgressCard.tsx`
- `apps/frontend/src/components/ui/BudgetSetupSheet.tsx` — create

---

### Issue 10 — Exam Form: Missing Submit Button

**Problem:** The exam creation form has no submit button, making it impossible to save a new exam.

**Fix:**

- Add a primary "Save Exam" button as the final element in the exam creation form.
- The button must be disabled while the form is submitting (show a loading spinner inside the button).
- On success, close the form/sheet and show the success sync toast.
- On validation failure, highlight the required fields (title and exam date are required; all others are optional).
- This is likely a one-line fix but must be covered by a test asserting the form can be submitted.

**Artifacts to Modify:**

- `apps/frontend/src/app/(app)/exams/ExamsClient.tsx`
- `apps/frontend/src/actions/exams.ts` — verify the create action is wired correctly

---

### Issue 11 — Dashboard Quick Actions: Three Sub-Fixes

#### 11a — Today's Classes: Tap to Show Detail, Not Navigate Away

**Problem:** Tapping a class on the dashboard today's classes section navigates to `/schedule` instead of showing the class detail inline.

**Fix:**

- Class cards in the dashboard "Today's Classes" section must open the existing `ClassDetailSheet` in-place, identical to how the schedule page handles class taps.
- Do not navigate to `/schedule`. The sheet slides up over the dashboard.
- Pass the selected `ClassRecord` to `ClassDetailSheet` via state in `DashboardClient`.

**Artifacts to Modify:**

- `apps/frontend/src/app/(app)/dashboard/DashboardClient.tsx`
- Import `ClassDetailSheet` from `components/ui/ClassDetailSheet`

#### 11b — Upcoming Deadlines: Tappable Cards + Functional "Add Task" Button

**Problem:** The "Add Task" button on the dashboard does nothing. Tapping a deadline card does not navigate to the detail.

**Fix for deadline cards:**

- Tapping an assignment deadline card must navigate to `/assignments` and, if a detail sheet is implemented for assignments, open that sheet for the specific assignment. As a minimum viable fix before a dedicated detail sheet exists, navigate to `/assignments` with a query param `?highlight={id}` and scroll that card into view.
- Tapping an exam deadline card must navigate to `/exams` with the same `?highlight={id}` behavior.

**Fix for "Add Task" button:**

- The "Add Task" button in the Upcoming Deadlines section must navigate to the `/chat` page with a pre-filled prompt, or alternatively open an inline quick-add sheet for assignments. The recommended approach is to link to `/chat?prompt=add+assignment` which pre-fills the chat input, keeping the natural-language-first UX consistent.
- Do not open a raw form from the dashboard; the chat is the primary creation surface per the PRD.

**Artifacts to Modify:**

- `apps/frontend/src/app/(app)/dashboard/DashboardClient.tsx`
- `apps/frontend/src/app/(app)/chat/ChatClient.tsx` — accept `?prompt=` query param and pre-fill input

#### 11c — Budget Status: Fix "Est. lasts N more days" Calculation

**Problem:** With ₱1,000 set and zero expenses, the estimate shows "Est. lasts 1000 more days." This is because the calculation divides remaining balance by daily spend rate, which is zero, and produces infinity or falls back to `remaining / 1`.

**Correct Calculation Logic:**

```
if (totalSpent === 0 && daysElapsedInCycle === 0) {
  // First day of cycle, no spend data yet
  label = "Budget just started"
} else if (totalSpent === 0 && daysElapsedInCycle > 0) {
  // Some days have passed but no spend recorded
  label = "No spending recorded yet"
} else {
  avgDailySpend = totalSpent / daysElapsedInCycle
  estimatedDaysLeft = Math.floor(remaining / avgDailySpend)
  label = `Est. lasts ${estimatedDaysLeft} more day(s)`
}
```

- `daysElapsedInCycle` = calendar days from `budget.start_date` to today (minimum 1 to avoid div-by-zero even on day 1 with some spend).
- The estimate must never exceed `daysRemainingInCycle` (the budget end date minus today). Cap it.
- The estimate must never be negative. If `remaining <= 0`, show "Over budget" instead.

**Artifacts to Modify:**

- `apps/frontend/src/lib/selectors/budget.ts` (or wherever `estimatedDaysLeft` is computed)
- `apps/frontend/src/components/ui/BudgetProgressCard.tsx`

---

### Issue 12 — Budget: Automatic Cycle Rollover and Hardened Budget Model

**Problem:** Budget requires manually entering `start_date` and `end_date`. For daily/weekly/biweekly/monthly periods, these should be auto-managed. The user cannot set a fixed daily allowance (e.g. ₱250/day) and have it reset automatically.

**Core Model Change:**

A budget now has two modes:

| Mode                      | Description                                                                                        |
| ------------------------- | -------------------------------------------------------------------------------------------------- |
| **Fixed cycle** (current) | User sets `start_date` and `end_date` manually. One-time budget.                                   |
| **Rolling period** (new)  | User sets `amount` and `period` (daily/weekly/biweekly/monthly). The system auto-generates cycles. |

For the MVP student use case, **rolling period is the default and primary path.** Fixed cycle is retained for edge cases (e.g. event budget, trip budget).

**Rolling Period Budget Creation UI:**

```
┌── Set Your Budget ──────────────────┐
│                                      │
│  How often do you receive your       │
│  allowance?                          │
│                                      │
│  [Daily] [Weekly] [Bi-Weekly] [Monthly] │  ← pill selector
│                                      │
│  Amount per period (₱)               │
│  ┌───────────────────────────┐       │
│  │  ₱ 1,000                  │       │
│  └───────────────────────────┘       │
│                                      │
│  Starts on                           │
│  [Today ▾]                           │  ← defaults to today, editable
│                                      │
│  [Save Budget]                       │
│                                      │
└──────────────────────────────────────┘
```

- No `end_date` input for rolling budgets — the system calculates it from `start_date + period`.
- Cycle end date is computed and stored on save (e.g., weekly from June 16 → end June 22).
- When the current date exceeds `end_date`, the budget engine must **automatically create a new cycle** with the same `amount` and `period`, starting the day after the previous `end_date`. This rollover happens client-side on app load (checking Dexie) and also server-side on the budgets endpoint.

**Rollover Logic (client-side, runs on app load):**

```
activeBudget = latest budget for user
if (activeBudget && today > activeBudget.end_date && activeBudget.is_rolling) {
  newStartDate = activeBudget.end_date + 1 day
  newEndDate = newStartDate + period
  create new budget record with same amount/period, new dates
  enqueue sync
}
```

**Category Breakdown:**

- All five categories must always be shown, even at 0%, with their emoji icon, label, amount spent, and percentage.
- Sort by amount descending, but Miscellaneous is always last.
- The "Other / Misc" label must show its actual percentage, not be collapsed or hidden.

**Hardened Budget Rules:**

- A user may only have **one active rolling budget at a time.** Saving a new budget while one is active must prompt: "You already have an active budget. Replace it?" with options "Replace" and "Cancel."
- The old budget is soft-closed (its `end_date` is set to yesterday) when replaced.
- Budget history (previous cycles) remains readable from `/settings/sync` or a dedicated "Budget History" section in the expenses page.

**Artifacts to Create/Modify:**

- `apps/frontend/src/lib/selectors/budget.ts` — rollover detection and new cycle creation
- `apps/frontend/src/actions/budgets.ts` — rolling budget create and rollover actions
- `apps/frontend/src/components/ui/BudgetSetupSheet.tsx` — new rolling-budget creation UI
- `apps/backend/src/services/budgets.service.ts` — add `is_rolling` field and rollover support
- `packages/database/src/schema/budgets.ts` — add `is_rolling: boolean`
- `packages/types/src/budget.ts` — add `is_rolling` to `Budget` type

---

### Issue 13 — Chat Quick Actions: Add "Add Exam" Quick Action

**Problem:** The chat quick actions panel includes "Add Task", "Add Expense", "Add Class", and "What's due?" but is missing "Add Exam."

**Fix:**

- Add a fifth quick action chip: **"Add Exam"** with an appropriate icon (`event` or `quiz` Material Symbol).
- Tapping it pre-fills the chat input with a prompt: `"add exam"` and optionally sends it immediately (matching the behavior of the other quick action chips).
- The quick action chips must remain scrollable horizontally on narrow screens if they overflow — do not wrap to a second row, as that disrupts the layout.
- The order of chips should be: `+ Task`, `+ Expense`, `+ Class`, `+ Exam`, `What's due?`

**Artifacts to Modify:**

- `apps/frontend/src/components/chat/QuickActions.tsx`

---

## V. Validation & Exit Criteria

### Issue 1

- [ ] `log_expense` and `create_assignment` AI intents show a result bubble with undo, not a confirmation card.
- [ ] `create_class` and `create_exam` AI intents still show a confirmation card before saving.
- [ ] Auto-confirmed intents create a Dexie record and enqueue sync immediately.
- [ ] The undo affordance in the result bubble works within 10 seconds.

### Issue 2

- [ ] No confirmation card displays the raw backend intent string (`create_assignment`, etc.).
- [ ] Every confirmation card shows the human-readable heading ("Add Assignment", etc.).
- [ ] `create_assignment` card includes title, due date/time, class link selector, and priority.
- [ ] `create_class` card includes subject, day(s), start/end time, room, and instructor.
- [ ] `create_exam` card includes title, date/time, class link, and location.
- [ ] Uncertain fields are visually marked.

### Issue 3

- [ ] No review card or chat bubble renders a raw UUID visible to the user.
- [ ] No review card or chat bubble renders a raw ISO 8601 timestamp.
- [ ] Class IDs resolve to subject names.
- [ ] All timestamps use the shared formatting utility.

### Issue 4

- [ ] Sync success shows a 3-second toast that auto-dismisses.
- [ ] Sync failure shows a persistent toast with retry.
- [ ] Failed sync items appear in the notification bell.
- [ ] No persistent sync status banner remains after 3 seconds on success.

### Issue 5

- [ ] `/settings/notifications` exists and contains all notification preference controls.
- [ ] `/settings/sync` exists and contains sync history and retry controls.
- [ ] `/settings/account` contains identity settings (was `/profile`).
- [ ] `/profile` redirects to `/settings/account`.
- [ ] Avatar menu in header links to the three settings sections.

### Issue 6

- [ ] Tapping the bell opens a notification drawer.
- [ ] The drawer contains upcoming reminders, sync failures, and AI action results.
- [ ] A red dot badge appears when there are unread items.
- [ ] The drawer is accessible via keyboard.
- [ ] Permission-denied state shows a prompt inside the drawer rather than blocking it.

### Issue 7

- [ ] On screens narrower than 640px, the schedule defaults to single-day view.
- [ ] Day selector strip is visible and functional on mobile.
- [ ] Time slots are at minimum 48px tall on mobile.
- [ ] Class blocks do not overflow their containers.
- [ ] "Add Class" on mobile is a FAB.

### Issue 8

- [ ] Tapping the assignment completion toggle calls the update action.
- [ ] The toggle state reflects the Dexie record immediately (optimistic).
- [ ] A failed toggle update reverts to the previous state.
- [ ] Completed assignments show strike-through and move to the "Done" tab.

### Issue 9

- [ ] "Log Expense" is a FAB in the bottom-right corner.
- [ ] "Edit Budget" is an inline text link inside the budget card.
- [ ] "Set up your budget" empty state is shown when no budget exists.
- [ ] All five expense categories are always visible in the breakdown, including those at 0%.

### Issue 10

- [ ] The exam creation form has a visible "Save Exam" button.
- [ ] The button is disabled during submission.
- [ ] Submitting a valid form creates the exam and closes the form.
- [ ] Validation errors on required fields are shown inline.

### Issue 11a

- [ ] Tapping a class on the dashboard opens `ClassDetailSheet`, not `/schedule`.

### Issue 11b

- [ ] Tapping an assignment deadline card navigates to `/assignments?highlight={id}`.
- [ ] Tapping an exam deadline card navigates to `/exams?highlight={id}`.
- [ ] "Add Task" button on the dashboard navigates to `/chat?prompt=add+assignment`.

### Issue 11c

- [ ] With ₱1,000 budget and zero expenses, the estimate shows "No spending recorded yet" not "Est. lasts 1000 more days."
- [ ] The estimate is capped at the remaining days in the budget cycle.
- [ ] The estimate shows "Over budget" when remaining ≤ 0.

### Issue 12

- [ ] Rolling budget creation UI shows period picker and amount, with no manual end-date input.
- [ ] After a cycle ends, a new cycle is automatically created on next app load.
- [ ] Only one active rolling budget is permitted; replacing prompts confirmation.
- [ ] All five expense categories are always visible in the breakdown.

### Issue 13

- [ ] Chat quick actions include "Add Exam" chip.
- [ ] Chip order is: `+ Task`, `+ Expense`, `+ Class`, `+ Exam`, `What's due?`
- [ ] Chips scroll horizontally on overflow, not wrap.

---

## VI. Required Tests

- **Build checks:** `pnpm --filter @unilife-ai/frontend build` and `pnpm --filter @unilife-ai/backend build`.
- **Lint checks:** `pnpm --filter @unilife-ai/frontend lint`.

**Per-issue test coverage:**

- Issue 1: Chat executor unit tests for auto-confirm vs. confirm routing per intent.
- Issue 2: Snapshot/render tests for each confirmation card type with all required fields present.
- Issue 3: Unit tests for `formatDateTime`, `formatDate`, `formatTime` in `packages/shared`. Regression test: no component renders a string matching ISO 8601 pattern in user-visible text.
- Issue 4: Sync engine event emission tests. Toast component tests for auto-dismiss timing.
- Issue 5: Navigation tests asserting `/profile` redirects to `/settings/account`. Route existence tests for all three new settings routes.
- Issue 6: Notification drawer open/close tests. Badge count tests. Permission-denied rendering test.
- Issue 7: Responsive rendering tests at 375px and 768px viewports for schedule. Touch target size assertion (≥44px) for class blocks.
- Issue 8: Assignment toggle integration test — fires update action, writes to Dexie, shows optimistic state, reverts on failure.
- Issue 9: Expenses page render test asserting FAB presence. Budget card render test asserting "Edit Budget" is inline text, not a primary button. All-five-categories render test.
- Issue 10: Exam form submit button existence test. Form submission integration test.
- Issue 11a: Dashboard class card tap test — asserts `ClassDetailSheet` opens, not router navigation.
- Issue 11b: Dashboard deadline card tap tests for assignment and exam. "Add Task" navigation test.
- Issue 11c: Unit tests for `estimatedDaysLeft` with zero spend, some spend, and over-budget cases.
- Issue 12: Budget rollover unit test — detects expired cycle and creates new one. One-active-budget constraint test.
- Issue 13: QuickActions render test asserting "Add Exam" chip is present in the correct position.

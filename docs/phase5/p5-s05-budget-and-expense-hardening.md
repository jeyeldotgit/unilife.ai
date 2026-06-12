# P5-S05 Budget and Expense Hardening

## I. Meta Specifications

**Spec Name:** P5-S05-budget-and-expense-hardening  
**Phase:** Phase 5  
**Responsibility:** Make finance tracking useful throughout a budget cycle by extending budget periods, preserving revisions, improving expense filtering, and adding safe refund and recurring-expense behavior.

## II. System Dependencies & Architectural Context

**Upstream Dependencies:**
- `P5-S02` mutation safety and duplicate-warning standards.
- `P5-S03` shared recurrence-series contracts.
- `P4-S03` local-first sync.
- Existing finance REST, selectors, Dexie tables, and allowance-planning calculations.

**Downstream Dependents:**
- `P5-S06` budget-alert notification preferences and sync recovery.

**Inputs (Reference Materials):**
- `packages/types/src/budget.ts`
- `packages/types/src/expense.ts`
- `packages/database/src/schema/budgets.ts`
- `packages/database/src/schema/expenses.ts`
- `apps/backend/src/routes/budgets.route.ts`
- `apps/backend/src/routes/expenses.route.ts`
- Frontend finance selectors, hooks, actions, and expense route

**Resolved Gaps:**
- Existing biweekly budgets remain supported and new daily budgets are added.
- Expenses remain recordable without an active budget.
- Refunds are negative expenses linked to their original expense; originals are never deleted to represent refunds.
- Budget changes preserve history rather than rewriting the user's financial context invisibly.

## III. Scope Boundaries

### A. In-Scope Elements

- Daily, weekly, biweekly, and monthly budget periods.
- Budget create/update settings and immutable revision history.
- Expense tracking without an active budget.
- Today, Yesterday, This Week, This Month, and Custom Range filters.
- Refund creation and original-expense linkage.
- Recurring expenses using the shared recurrence model.
- Likely-duplicate expense warnings.
- Finance selector and allowance-planning compatibility.

### B. Out-of-Scope Elements

- Bank, wallet, or payment-provider integrations.
- Multiple displayed currencies.
- Income tracking beyond refund representation.
- Advanced financial forecasting beyond existing allowance-planning behavior.
- Automatic category inference from receipts.

## IV. Technical Delivery Requirements

### A. Artifacts & Deliverables to Produce

- Add `daily` to shared, backend, sync, and frontend budget period validation.
- Add a user-scoped budget revision-history table and read contract.
- Add refund linkage and recurrence linkage to expense persistence and types.
- Extend finance filters and route UI.
- Add recurring-expense creation, occurrence editing, future editing, and cancellation.
- Update finance selectors and allowance calculations for negative linked refunds and revised budgets.

### B. Budget Rules

- Supported periods are `daily`, `weekly`, `biweekly`, and `monthly`.
- Existing biweekly records remain editable and selectable.
- Creating or changing an active budget never blocks expense creation.
- Every successful budget amount, period, start-date, or end-date change writes an immutable revision containing the prior and resulting values, change time, and originating mutation ID.
- Budget status and allowance calculations use the current active budget record, while history remains available for review.
- Repeated sync/retry of one logical update must not duplicate its revision.

### C. Expense Filters And Date Rules

- Named filters resolve in the user's timezone.
- `Today` and `Yesterday` use local calendar boundaries.
- `This Week` begins Monday.
- `This Month` uses the local calendar month.
- `Custom Range` accepts inclusive start/end dates and validates start is not after end.
- Filter results and displayed totals use the same resolved boundaries.

### D. Refund Rules

- Add `refund_of_expense_id: string | null` to expenses.
- Positive ordinary expenses must not set `refund_of_expense_id`.
- Negative amounts are accepted only when linked to an existing user-owned, non-refund expense.
- A refund cannot exceed the original expense's unrefunded amount.
- Multiple partial refunds are allowed up to the original amount.
- Refunds inherit the original budget link by default and preserve the original expense unchanged.
- Refunds are included in totals and allowance calculations as negative spending.

### E. Recurring Expense And Duplicate Rules

- Recurring expenses reuse the `P5-S03` series, occurrence, exception, edit-scope, revision, and sync contracts.
- Occurrences are created automatically within the centralized rolling horizon.
- Users may edit one occurrence, future occurrences, or the series and may cancel future occurrences.
- Likely duplicate detection considers amount, category, description similarity, and nearby spend time.
- Duplicate warnings allow saving anyway after acknowledgement.

## V. Validation & Exit Criteria

- Users can create and use daily, weekly, biweekly, and monthly budgets.
- Updating a budget produces exactly one revision per logical update and preserves prior values.
- Users can record and browse expenses without an active budget.
- All named and custom date filters return timezone-correct records and totals.
- Refunds preserve the original expense and cannot exceed its refundable amount.
- Recurring expense occurrences remain idempotent through edit, reconnect, and retry.
- Duplicate expense warnings do not block intentional duplicates.
- Budget status and allowance calculations account for linked refunds correctly.

## VI. Required Tests

- Contract and validation tests for all four budget periods.
- Budget revision tests for update, retry, reconnect, stale last-write-wins payload, and user scoping.
- Date-filter tests around midnight, Monday week boundaries, month boundaries, and timezone changes.
- Refund tests for full, partial, repeated, excessive, foreign-user, and refund-of-refund attempts.
- Recurring-expense tests for materialization, edit scopes, cancellation, idempotency, and sync.
- Duplicate warning tests for likely and intentional duplicates.
- Regression tests for expense tracking without a budget and allowance calculations with refunds.
- Frontend and backend build, lint, and test checks.

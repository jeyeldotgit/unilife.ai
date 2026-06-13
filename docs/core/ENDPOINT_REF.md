# UniLife.AI — REST API Endpoint Reference

**Version:** 1.0 MVP  
**Transport:** REST over HTTP (Hono)  
**Base path:** `/api` for application endpoints; `/health` remains a public deployment health check  
**Auth:** All protected endpoints require `Authorization: Bearer <supabase_jwt>` header  
**Protocol note:** Request bodies are JSON. List filters use query parameters. Path parameters use the `:id` notation in this document.

---

## Resource Map

| Resource    | Endpoints             | Auth Required |
| ----------- | --------------------- | ------------- |
| Health      | `GET /health`         | No            |
| Sync        | `/api/sync/*`         | Yes           |
| Classes     | `/api/classes/*`      | Yes           |
| Assignments | `/api/assignments/*`  | Yes           |
| Exams       | `/api/exams/*`        | Yes           |
| Expenses    | `/api/expenses/*`     | Yes           |
| Budgets     | `/api/budgets/*`      | Yes           |
| AI          | `/api/ai/*`           | Yes           |

---

---

## GET /health

**Type:** Public REST endpoint  
**Responsibility:** Liveness check. Confirms the backend process is running and reachable. Used by deployment health checks and the frontend to detect connectivity.

### Request

No input.

### Response

```ts
{
  ok: true;
  timestamp: string; // ISO 8601, e.g. "2026-06-04T08:00:00.000Z"
}
```

---

---

## POST /api/sync/push

**Type:** Protected REST endpoint  
**Responsibility:** Accepts a batch of offline-queued operations from the client sync engine and applies them to Supabase. Implements last-write-wins conflict resolution using `updated_at`. Returns which items succeeded and which failed so the client can update its local `sync_queue` statuses.

### Request

```ts
{
  items: Array<{
    id: string; // sync_queue item UUID (client-generated)
    entity_type: "class" | "assignment" | "exam" | "expense" | "budget";
    entity_id: string; // UUID of the actual entity
    operation: "create" | "update" | "delete";
    payload: Record<string, unknown>; // full entity snapshot including updated_at
  }>;
}
```

### Response

```ts
{
  synced: string[]; // sync_queue item IDs that succeeded
  failed: string[]; // sync_queue item IDs that failed (will be retried by client)
}
```

### Conflict resolution

For `update` operations: the backend compares `payload.updated_at` against the stored record's `updated_at`. If the payload is older, the update is silently dropped and the item is still marked `synced` (the server's version wins). For `delete` operations: sets `deleted_at = NOW()` regardless of `updated_at`. For `create` operations: upserts on `id` conflict.

---

---

## GET /api/classes

**Type:** Protected REST endpoint  
**Responsibility:** Returns all non-deleted classes for the authenticated user. Supports delta sync via optional `since` timestamp so the client only fetches records changed after its last sync.

### Request

```ts
{
  since?: string; // ISO 8601 — if provided, returns only records where updated_at > since
}
```

### Response

```ts
{
  classes: Array<{
    id: string;
    user_id: string;
    subject: string;
    room: string | null;
    instructor: string | null;
    day_of_week:
      | "monday"
      | "tuesday"
      | "wednesday"
      | "thursday"
      | "friday"
      | "saturday"
      | "sunday";
    start_time: string; // "HH:MM" 24-hour
    end_time: string; // "HH:MM" 24-hour
    color: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
  }>;
}
```

---

## GET /api/classes/:id

**Type:** Protected REST endpoint  
**Responsibility:** Fetches a single class record by ID. Used when navigating to the class detail bottom sheet and when the sync engine needs to verify a record exists before updating.

### Request

```ts
{
  id: string; // UUID
}
```

### Response

```ts
{
  class: {
    id: string;
    user_id: string;
    subject: string;
    room: string | null;
    instructor: string | null;
    day_of_week: string;
    start_time: string;
    end_time: string;
    color: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
  } | null;
}
```

---

## POST /api/classes

**Type:** Protected REST endpoint  
**Responsibility:** Persists a new class record to Supabase. Called by the sync engine when flushing a `create` operation for a class. Not called directly by the frontend (frontend writes to Dexie first, then enqueues sync).

### Request

```ts
{
  id: string;          // client-generated UUID
  subject: string;
  day_of_week: "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";
  start_time: string;  // "HH:MM"
  end_time: string;    // "HH:MM"
  room?: string;
  instructor?: string;
  color?: string;
  created_at: string;
  updated_at: string;
}
```

### Response

```ts
{
  class: { /* full ClassRecord */ };
}
```

---

## PATCH /api/classes/:id

**Type:** Protected REST endpoint  
**Responsibility:** Updates a class record. Uses last-write-wins on `updated_at`. Called by sync engine only.

### Request

```ts
{
  id: string;
  subject?: string;
  room?: string;
  instructor?: string;
  day_of_week?: string;
  start_time?: string;
  end_time?: string;
  color?: string;
  is_active?: boolean;
  updated_at: string; // required for conflict check
}
```

### Response

```ts
{
  class: { /* full ClassRecord */ } | null; // null if conflict resolution rejected the update
}
```

---

## DELETE /api/classes/:id

**Type:** Protected REST endpoint  
**Responsibility:** Soft-deletes a class by setting `deleted_at`. Called by sync engine only. Does not cascade delete assignments — linked assignments remain and have `class_id` set to null by the DB foreign key constraint (`ON DELETE SET NULL`).

### Request

```ts
{
  id: string;
}
```

### Response

```ts
{
  ok: boolean;
}
```

---

---

## GET /api/assignments

**Type:** Protected REST endpoint  
**Responsibility:** Returns all non-deleted assignments for the user. Used during initial load and delta sync. The dashboard and assignments screen read from Dexie locally; this endpoint is called by the sync engine to reconcile after reconnection.

### Request

```ts
{
  since?: string;   // ISO 8601 for delta sync
  status?: "pending" | "in_progress" | "completed"; // optional filter
}
```

### Response

```ts
{
  assignments: Array<{
    id: string;
    user_id: string;
    class_id: string | null;
    title: string;
    description: string | null;
    due_date: string; // ISO 8601
    status: "pending" | "in_progress" | "completed";
    priority: number; // 1–3
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
  }>;
}
```

---

## GET /api/assignments/:id

**Type:** Protected REST endpoint  
**Responsibility:** Fetches a single assignment by ID. Used when a notification deep-link opens the Assignment Detail screen and Dexie does not have the record (e.g. after app reinstall).

### Request

```ts
{
  id: string;
}
```

### Response

```ts
{
  assignment: { /* full Assignment */ } | null;
}
```

---

## POST /api/assignments

**Type:** Protected REST endpoint  
**Responsibility:** Creates an assignment in Supabase. Called by sync engine for `create` operations. The notification schedule for this assignment should already be stored in Dexie locally; the backend does not re-schedule notifications (notifications are client-driven in MVP).

### Request

```ts
{
  id: string;
  title: string;
  due_date: string;      // ISO 8601
  class_id?: string;
  description?: string;
  priority?: number;     // defaults to 1
  status?: "pending" | "in_progress" | "completed"; // defaults to "pending"
  created_at: string;
  updated_at: string;
}
```

### Response

```ts
{
  assignment: {
    /* full Assignment */
  }
}
```

---

## PATCH /api/assignments/:id

**Type:** Protected REST endpoint  
**Responsibility:** Updates an assignment. Covers status changes (pending → in_progress → completed), due date edits, and title changes. Called by sync engine only.

### Request

```ts
{
  id: string;
  title?: string;
  due_date?: string;
  class_id?: string | null;
  description?: string | null;
  status?: "pending" | "in_progress" | "completed";
  priority?: number;
  updated_at: string;
}
```

### Response

```ts
{
  assignment: { /* full Assignment */ } | null;
}
```

---

## DELETE /api/assignments/:id

**Type:** Protected REST endpoint  
**Responsibility:** Soft-deletes an assignment. Linked notifications in the `notifications` table remain but will not fire since the client removes them from Dexie on delete.

### Request

```ts
{
  id: string;
}
```

### Response

```ts
{
  ok: boolean;
}
```

---

---

## GET /api/exams

**Type:** Protected REST endpoint  
**Responsibility:** Returns all non-deleted exams for the user. Feeds the dashboard countdown display and the free time finder context. Delta-sync supported.

### Request

```ts
{
  since?: string;
}
```

### Response

```ts
{
  exams: Array<{
    id: string;
    user_id: string;
    class_id: string | null;
    title: string;
    description: string | null;
    exam_date: string; // ISO 8601
    location: string | null;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
  }>;
}
```

---

## GET /api/exams/:id

**Type:** Protected REST endpoint  
**Responsibility:** Fetches a single exam record by ID.

### Request

```ts
{
  id: string;
}
```

### Response

```ts
{
  exam: { /* full Exam */ } | null;
}
```

---

## POST /api/exams

**Type:** Protected REST endpoint  
**Responsibility:** Persists a new exam to Supabase via sync engine.

### Request

```ts
{
  id: string;
  title: string;
  exam_date: string;
  class_id?: string;
  description?: string;
  location?: string;
  created_at: string;
  updated_at: string;
}
```

### Response

```ts
{
  exam: {
    /* full Exam */
  }
}
```

---

## PATCH /api/exams/:id

**Type:** Protected REST endpoint  
**Responsibility:** Updates an exam record. Last-write-wins on `updated_at`.

### Request

```ts
{
  id: string;
  title?: string;
  exam_date?: string;
  class_id?: string | null;
  description?: string | null;
  location?: string | null;
  updated_at: string;
}
```

### Response

```ts
{
  exam: { /* full Exam */ } | null;
}
```

---

## DELETE /api/exams/:id

**Type:** Protected REST endpoint  
**Responsibility:** Soft-deletes an exam.

### Request

```ts
{
  id: string;
}
```

### Response

```ts
{
  ok: boolean;
}
```

---

---

## GET /api/expenses

**Type:** Protected REST endpoint  
**Responsibility:** Returns all non-deleted expenses for the user. Used for the Expenses screen list and spending-by-category breakdown. Can be filtered by date range to scope to the active budget period.

### Request

```ts
{
  since?: string;        // ISO 8601 — delta sync
  from?: string;         // ISO 8601 date — filter: spent_at >= from
  to?: string;           // ISO 8601 date — filter: spent_at <= to
  category?: "food" | "transportation" | "school" | "entertainment" | "miscellaneous";
}
```

### Response

```ts
{
  expenses: Array<{
    id: string;
    user_id: string;
    budget_id: string | null;
    amount: number;
    category:
      | "food"
      | "transportation"
      | "school"
      | "entertainment"
      | "miscellaneous";
    description: string | null;
    spent_at: string;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
  }>;
  total: number; // sum of amount across returned records
}
```

---

## POST /api/expenses

**Type:** Protected REST endpoint  
**Responsibility:** Persists a logged expense to Supabase. Called by sync engine. The `budget_id` should be the active budget's ID at the time of logging; the client resolves this locally before enqueueing.

### Request

```ts
{
  id: string;
  amount: number;          // positive, in PHP
  category: "food" | "transportation" | "school" | "entertainment" | "miscellaneous";
  budget_id?: string;
  description?: string;
  spent_at: string;        // ISO 8601 — defaults to now if omitted by client
  created_at: string;
  updated_at: string;
}
```

### Response

```ts
{
  expense: {
    /* full Expense */
  }
}
```

---

## DELETE /api/expenses/:id

**Type:** Protected REST endpoint  
**Responsibility:** Soft-deletes an expense. No update endpoint is provided in MVP — incorrect expenses must be deleted and re-logged.

### Request

```ts
{
  id: string;
}
```

### Response

```ts
{
  ok: boolean;
}
```

---

---

## GET /api/budgets

**Type:** Protected REST endpoint  
**Responsibility:** Returns all budget periods for the user, ordered by `start_date` descending. The client uses this to identify the current active budget (the one where `start_date <= today <= end_date`).

### Request

```ts
{
  since?: string;
}
```

### Response

```ts
{
  budgets: Array<{
    id: string;
    user_id: string;
    amount: number;
    period: "weekly" | "biweekly" | "monthly";
    start_date: string; // ISO 8601 date
    end_date: string; // ISO 8601 date
    created_at: string;
    updated_at: string;
  }>;
}
```

---

## POST /api/budgets

**Type:** Protected REST endpoint  
**Responsibility:** Creates a new budget period. Called during onboarding (Step 2 of the setup wizard) and when the user starts a new cycle. The client computes `start_date` and `end_date` from the selected `period` and the current date.

### Request

```ts
{
  id: string;
  amount: number;
  period: "weekly" | "biweekly" | "monthly";
  start_date: string; // ISO 8601 date
  end_date: string; // ISO 8601 date
  created_at: string;
  updated_at: string;
}
```

### Response

```ts
{
  budget: {
    /* full Budget */
  }
}
```

---

## PATCH /api/budgets/:id

**Type:** Protected REST endpoint  
**Responsibility:** Updates the budget amount or period. Typically called when the user edits their allowance settings.

### Request

```ts
{
  id: string;
  amount?: number;
  period?: "weekly" | "biweekly" | "monthly";
  end_date?: string;
  updated_at: string;
}
```

### Response

```ts
{
  budget: { /* full Budget */ } | null;
}
```

---

---

## POST /api/ai/chat

**Type:** Protected REST endpoint  
**Responsibility:** The primary AI endpoint. Receives the user's raw chat message and a rich context payload, sends it to Gemini Flash with a structured system prompt, and returns a parsed intent + action + friendly reply. Handles all queries that the local parser cannot resolve with sufficient confidence: Filipino-language inputs, planning queries, allowance forecasts, free time analysis, and general questions.

This endpoint also handles Story 6 (allowance forecast), Story 7 (Filipino class creation), and Story 10 (free time finder). The `context` object must be populated by the frontend before calling — it is not fetched server-side.

### Request

```ts
{
  message: string; // raw user input, 1–1000 chars

  context: {
    today: string; // ISO 8601 date, e.g. "2026-06-04"
    current_time: string; // "HH:MM" 24-hour, e.g. "13:00"

    // Schedule context — required for free time finder (Story 10)
    todays_classes: Array<{
      subject: string;
      start_time: string; // "HH:MM"
      end_time: string; // "HH:MM"
    }>;

    // Deadline context — required for free time finder and planning queries
    upcoming_deadlines: Array<{
      title: string;
      due_date: string; // ISO 8601
      type: "assignment" | "exam";
      status: "pending" | "in_progress";
    }>;

    // Budget context — required for allowance forecast (Story 6)
    budget_remaining: number | null; // PHP amount remaining
    budget_period_end_date: string | null; // ISO 8601 date — end of current cycle
    avg_daily_spend: number | null; // computed client-side from recent expenses
  }
}
```

### Response

```ts
{
  intent:
    | "create_assignment"
    | "create_class"
    | "create_exam"
    | "log_expense"
    | "query_schedule"
    | "query_deadlines"
    | "query_budget"
    | "free_time_finder"
    | "allowance_forecast"
    | "general_question"
    | "unknown";

  // Populated when intent maps to a CRUD action.
  // The frontend executes the action against Dexie and enqueues sync.
  // The backend does NOT write to the DB directly from this endpoint.
  action: {
    // create_assignment
    title?: string;
    due_date?: string;
    class_id?: string | null;

    // create_class
    subject?: string;
    day_of_week?: string;
    start_time?: string;
    end_time?: string;

    // create_exam
    exam_date?: string;
    location?: string;

    // log_expense
    amount?: number;
    category?: "food" | "transportation" | "school" | "entertainment" | "miscellaneous";
  } | null;

  // Human-readable reply shown in the chat bubble.
  // Language matches user input (Filipino or English).
  message: string;

  // Only present for allowance_forecast intent
  forecast?: {
    remaining: number;
    days_left_in_cycle: number;
    avg_daily_spend: number;
    projected_runout_days: number;  // estimated days until ₱0
    recommended_daily_limit: number;
  };

  // Only present for free_time_finder intent
  free_time?: {
    window_minutes: number;
    next_class_subject: string | null;
    next_class_time: string | null;
    suggested_tasks: Array<{
      title: string;
      due_date: string;
      type: "assignment" | "exam";
      urgency_days: number;
    }>;
  };

  // True for every response containing a write proposal.
  requires_confirmation: boolean;

  proposal: {
    id: string;
    processing_layer: "gemini";
    status: "proposed";
    operations: Array<{
      id: string;
      operation: "create" | "update" | "delete";
      entity_type: "class" | "assignment" | "exam" | "expense";
      entity_id: string | null;
      before: null;
      proposed: Record<string, unknown>;
      uncertain_fields: string[];
      confidence: number | null;
      status: "proposed";
      approved_payload: null;
      applied_revision: null;
      error: null;
    }>;
    created_at: string;
    updated_at: string;
  } | null;
}
```

### Notes

- The backend does **not** write to the database from this endpoint. It returns a structured `action` payload and the frontend is responsible for writing to Dexie and enqueueing sync. This keeps the AI layer stateless and avoids double-writes when users edit before confirming.
- All Gemini calls are logged to `ai_logs` with `processing_layer = "gemini"`, including the raw input, detected intent, and any error.
- `ai_logs` remains provider telemetry. User-visible proposal lifecycle state is stored separately in `ai_action_history`.
- If Gemini is unavailable (503, timeout, quota exceeded), the endpoint returns `{ intent: "unknown", action: null, message: "...", requires_confirmation: false }` with a user-friendly fallback message. It does not throw a 500.

---

## GET /api/ai/actions

**Type:** Protected REST endpoint
**Responsibility:** Returns user-scoped AI proposal/action history for hydration of the local-first history surface. Supports an optional `since` timestamp for delta hydration.

### Response

```ts
{
  actions: AiActionHistory[];
}
```

AI action-history writes are produced locally after review/apply/undo and synchronized through `POST /api/sync/push` with `entity_type = "ai_action"`.

---

---

## Error Shapes

All REST errors use the same JSON envelope:

```ts
{
  error: {
    code:
      | "UNAUTHENTICATED"
      | "FORBIDDEN"
      | "NOT_FOUND"
      | "VALIDATION_ERROR"
      | "CONFLICT"
      | "EXTERNAL_SERVICE_UNAVAILABLE"
      | "INTERNAL_ERROR";
    message: string;
    details?: unknown;
  }
}
```

| Scenario                          | Error code                       | HTTP status |
| --------------------------------- | -------------------------------- | ----------- |
| Missing or expired JWT            | `UNAUTHENTICATED`                | 401         |
| Accessing another user's resource | `FORBIDDEN`                      | 403         |
| Record not found                  | `NOT_FOUND`                      | 404         |
| Request validation failure        | `VALIDATION_ERROR`               | 400         |
| Stale write conflict              | `CONFLICT`                       | 409         |
| Gemini API unavailable            | `EXTERNAL_SERVICE_UNAVAILABLE`   | 503         |
| Unexpected server error           | `INTERNAL_ERROR`                 | 500         |

---

## Endpoint Count Summary

| Resource    | Endpoints | Methods                         |
| ----------- | --------- | ------------------------------- |
| health      | 1         | 1 GET                           |
| sync        | 1         | 1 POST                          |
| classes     | 5         | 2 GET, 1 POST, 1 PATCH, 1 DELETE |
| assignments | 5         | 2 GET, 1 POST, 1 PATCH, 1 DELETE |
| exams       | 5         | 2 GET, 1 POST, 1 PATCH, 1 DELETE |
| expenses    | 3         | 1 GET, 1 POST, 1 DELETE         |
| budgets     | 3         | 1 GET, 1 POST, 1 PATCH          |
| ai          | 1         | 1 POST                          |
| **Total**   | **24**    | **9 GET, 7 POST, 4 PATCH, 4 DELETE** |

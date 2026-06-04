# P2-S05 AI Chat Gemini Actions and Logging

## I. Meta Specifications

**Spec Name:** P2-S05-ai-chat-gemini-actions-and-logging  
**Phase:** Phase 2  
**Responsibility:** Implement the protected `POST /api/ai/chat` endpoint that turns student messages into structured actions or replies, logs Gemini activity, and remains stateless with respect to CRUD writes.

## II. System Dependencies & Architectural Context

**Upstream Dependencies:**
- P2-S01-backend-rest-auth-and-contract-foundation.

**Related Specs:**
- P2-S02 academic CRUD provides the target entities for structured academic actions.
- P2-S03 finance CRUD provides the target entities for expense and budget-related actions.
- P2-S04 sync push eventually persists frontend-confirmed actions.

**Inputs (Reference Materials):**
- `apps/backend/AGENTS.md`
- `docs/core/BACKEND_ARCH.md`
- `docs/core/ENDPOINT_REF.md`
- `docs/core/LLD.md`
- `docs/core/STORYBOARD.md`
- `packages/ai-core`
- `packages/database/src/schema/ai_logs.ts`
- `packages/types/src/ai-log.ts`

**Resolved Gaps:**
- `ai.chat` does not write classes, assignments, exams, expenses, or budgets directly.
- The frontend is responsible for writing confirmed actions to Dexie and enqueueing sync.
- Gemini failure should return a friendly `unknown` response instead of surfacing a 500 to the student.
- The richer `ENDPOINT_REF.md` AI contract takes precedence over the shorter LLD example.

## III. Scope Boundaries

### A. In-Scope Elements

- Protected `POST /api/ai/chat` endpoint.
- Gemini Flash request through `packages/ai-core`.
- Structured output parsing and validation.
- Intent support:
  - `create_assignment`
  - `create_class`
  - `create_exam`
  - `log_expense`
  - `query_schedule`
  - `query_deadlines`
  - `query_budget`
  - `free_time_finder`
  - `allowance_forecast`
  - `general_question`
  - `unknown`
- Action payload support for academic and finance create intents.
- Optional `forecast` response for allowance forecast.
- Optional `free_time` response for free time finder.
- `requires_confirmation` behavior for low-confidence or user-confirmable actions.
- `ai_logs` repository logging for success and failure.

### B. Out-of-Scope Elements

- Direct CRUD writes from `ai.chat`.
- Frontend confirm/edit UI.
- Dexie write and sync queue implementation.
- Local parser package changes unless required to normalize Gemini outputs.
- Server-side fetching of classes, assignments, exams, expenses, or budgets for context.

## IV. Technical Delivery Requirements

### A. Artifacts & Deliverables to Produce

- `apps/backend/src/routes/ai.route.ts`
- `apps/backend/src/controllers/ai.controller.ts`
- `apps/backend/src/services/ai.service.ts`
- `apps/backend/src/repositories/ai-logs.repository.ts`
- Zod schemas for AI request and response validation.
- Root route registration update wiring `/api/ai`.

### B. Core Implementation Constraints

- `POST /api/ai/chat` uses the shared auth middleware from P2-S01.
- The route validates request shape and calls one controller method.
- The controller shapes the final JSON response and triggers logging through the service.
- The service owns Gemini calls, prompt/context assembly, response parsing, fallback behavior, and forecast/free-time calculations.
- The repository owns writes to `ai_logs`.
- The backend must not write domain CRUD records from this endpoint.
- The endpoint must accept frontend-provided context and must not fetch context server-side in MVP.
- Gemini errors, timeouts, quota failures, malformed responses, or validation failures must produce a safe fallback response.

### C. Request Contract

Input:

```ts
{
  message: string;
  context: {
    today: string;
    current_time: string;
    todays_classes: Array<{
      subject: string;
      start_time: string;
      end_time: string;
    }>;
    upcoming_deadlines: Array<{
      title: string;
      due_date: string;
      type: "assignment" | "exam";
      status: "pending" | "in_progress";
    }>;
    budget_remaining: number | null;
    budget_period_end_date: string | null;
    avg_daily_spend: number | null;
  };
}
```

Validation requirements:
- `message` must be 1 to 1000 characters.
- Date/time fields must be accepted as strings and passed through consistently.
- Context arrays may be empty.

### D. Response Contract

Output:

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
  action: Record<string, unknown> | null;
  message: string;
  forecast?: {
    remaining: number;
    days_left_in_cycle: number;
    avg_daily_spend: number;
    projected_runout_days: number;
    recommended_daily_limit: number;
  };
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
  requires_confirmation: boolean;
}
```

## V. Validation & Exit Criteria

A successful implementation must verifiably satisfy:

- Unauthenticated requests return `UNAUTHENTICATED` before Gemini or logging work runs.
- Valid English and Filipino messages return structured responses.
- `create_class` and low-confidence structured actions set `requires_confirmation: true`.
- CRUD-oriented intents return `action` data but do not write domain records.
- Allowance forecast responses include `forecast` when enough budget context exists.
- Free time finder responses include `free_time` when enough schedule/deadline context exists.
- Gemini outages return `{ intent: "unknown", action: null, message, requires_confirmation: false }`.
- Successful and failed Gemini attempts are logged to `ai_logs`.
- `pnpm --filter @unilife-ai/backend build` succeeds.

## VI. Required Tests

- Build check: `pnpm --filter @unilife-ai/backend build`.
- Service unit tests with mocked Gemini client for each major intent group.
- Fallback tests for timeout, quota, malformed JSON, and validation failure.
- Tests proving `ai.chat` does not call academic or finance repositories.
- AI logging tests for success and failure.
- Endpoint auth gating test for `POST /api/ai/chat`.

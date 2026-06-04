# UniLife.AI - Backend Architecture Guide

## Route -> Controller -> Service -> Repository

**Version:** 1.0 MVP  
**Scope:** `apps/backend/src/`  
**Stack:** Hono REST API + Supabase service-role client

UniLife.AI uses REST as the canonical backend transport. Do not add alternate RPC routers or non-REST transports for Phase 2 backend work.

---

## Why 4 Layers for REST

REST route files can easily grow into mixed transport, business, and database code. The four-layer split keeps each concern testable and replaceable:

- Reuse business logic across endpoints, such as `POST /api/sync/push` and `POST /api/assignments`.
- Unit test services without running Hono or Supabase.
- Swap repository details without changing route handlers.
- Return one consistent REST error envelope.

| Layer | File location | Owns | Does NOT own |
| --- | --- | --- | --- |
| **Route** | `routes/*.route.ts` | Hono route declarations, auth middleware, Zod path/query/body validation, controller calls | Business logic, raw Supabase queries |
| **Controller** | `controllers/*.controller.ts` | Request orchestration, ownership checks, response shaping, REST error mapping | Raw Supabase queries, domain calculations |
| **Service** | `services/*.service.ts` | Business rules, transformations, conflict resolution, cross-entity coordination | Hono contexts, HTTP responses, raw Supabase queries |
| **Repository** | `repositories/*.repository.ts` | Supabase reads/writes, sorting, filtering, soft deletes | Business decisions, response shaping |

---

## Updated File Structure

```text
apps/backend/
└── src/
    ├── index.ts                    # Node server entrypoint
    ├── app.ts                      # Hono app setup and CORS
    ├── router.ts                   # Registers all REST route groups
    │
    ├── routes/                     # Layer 1 - Hono REST route declarations
    │   ├── health.route.ts
    │   ├── sync.route.ts
    │   ├── classes.route.ts
    │   ├── assignments.route.ts
    │   ├── exams.route.ts
    │   ├── expenses.route.ts
    │   ├── budgets.route.ts
    │   └── ai.route.ts
    │
    ├── controllers/                # Layer 2 - request orchestration
    │   ├── sync.controller.ts
    │   ├── classes.controller.ts
    │   ├── assignments.controller.ts
    │   ├── exams.controller.ts
    │   ├── expenses.controller.ts
    │   ├── budgets.controller.ts
    │   └── ai.controller.ts
    │
    ├── services/                   # Layer 3 - business logic
    │   ├── sync.service.ts
    │   ├── classes.service.ts
    │   ├── assignments.service.ts
    │   ├── exams.service.ts
    │   ├── expenses.service.ts
    │   ├── budgets.service.ts
    │   └── ai.service.ts
    │
    ├── repositories/               # Layer 4 - Supabase queries
    │   ├── classes.repository.ts
    │   ├── assignments.repository.ts
    │   ├── exams.repository.ts
    │   ├── expenses.repository.ts
    │   ├── budgets.repository.ts
    │   └── ai-logs.repository.ts
    │
    ├── middleware/
    │   └── auth.ts                 # Bearer JWT validation and user context
    │
    └── lib/
        ├── http-errors.ts          # REST error helpers and envelope
        ├── validation.ts           # Zod body/query/param helpers
        └── supabase.ts             # Supabase service-role client factory
```

---

## Layer Contracts

### Request Flow

```text
HTTP client
  -> Hono route
  -> Controller
  -> Service
  -> Repository
  -> Supabase PostgreSQL
```

The controller never touches Supabase directly.  
The service never knows about Hono or HTTP.  
The repository never makes business decisions.

---

## Layer 1 - Routes

**Single responsibility:** declare Hono REST endpoints, apply auth middleware, validate path/query/body input with Zod, extract `userId` from request context, and call one controller method.

### Pattern

```typescript
// routes/assignments.route.ts
import { Hono } from "hono";
import { z } from "zod";
import { AssignmentsController } from "../controllers/assignments.controller";
import { requireAuth } from "../middleware/auth";
import { createSupabaseClient } from "../lib/supabase";
import { parseJsonBody, parseQuery } from "../lib/validation";

const listQuerySchema = z.object({
  since: z.string().datetime().optional(),
  status: z.enum(["pending", "in_progress", "completed"]).optional(),
});

const idParamSchema = z.object({ id: z.string().uuid() });

const createAssignmentSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(255),
  due_date: z.string().datetime(),
  class_id: z.string().uuid().optional(),
  description: z.string().max(2000).optional(),
  priority: z.number().int().min(1).max(3).optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

const updateAssignmentSchema = createAssignmentSchema
  .partial()
  .extend({ updated_at: z.string().datetime() })
  .omit({ id: true, created_at: true });

export const assignmentsRoute = new Hono();

assignmentsRoute.use("*", requireAuth);

assignmentsRoute.get("/", async (c) => {
  const input = parseQuery(c, listQuerySchema);
  const controller = new AssignmentsController(
    createSupabaseClient(),
    c.get("userId"),
  );
  return c.json(await controller.list(input), 200);
});

assignmentsRoute.get("/:id", async (c) => {
  const { id } = idParamSchema.parse(c.req.param());
  const controller = new AssignmentsController(
    createSupabaseClient(),
    c.get("userId"),
  );
  return c.json(await controller.get(id), 200);
});

assignmentsRoute.post("/", async (c) => {
  const input = await parseJsonBody(c, createAssignmentSchema);
  const controller = new AssignmentsController(
    createSupabaseClient(),
    c.get("userId"),
  );
  return c.json(await controller.create(input), 201);
});

assignmentsRoute.patch("/:id", async (c) => {
  const { id } = idParamSchema.parse(c.req.param());
  const input = await parseJsonBody(c, updateAssignmentSchema);
  const controller = new AssignmentsController(
    createSupabaseClient(),
    c.get("userId"),
  );
  return c.json(await controller.update(id, input), 200);
});

assignmentsRoute.delete("/:id", async (c) => {
  const { id } = idParamSchema.parse(c.req.param());
  const controller = new AssignmentsController(
    createSupabaseClient(),
    c.get("userId"),
  );
  return c.json(await controller.delete(id), 200);
});
```

**Rules for routes:**

- No business logic.
- No direct Supabase calls.
- No ownership decisions.
- Routes parse HTTP input, validate schemas, instantiate controllers, and return JSON.
- Protected route groups must use `requireAuth` before any controller method can run.

---

## Layer 2 - Controllers

**Single responsibility:** orchestrate one request, enforce ownership, coordinate service calls, and return a response payload. Controllers may map known failures to REST errors.

### Pattern

```typescript
// controllers/assignments.controller.ts
import type { SupabaseClient } from "@supabase/supabase-js";
import { forbidden } from "../lib/http-errors";
import { AssignmentsService } from "../services/assignments.service";

export class AssignmentsController {
  private service: AssignmentsService;

  constructor(
    supabase: SupabaseClient,
    private readonly userId: string,
  ) {
    this.service = new AssignmentsService(supabase, userId);
  }

  async list(filters: { since?: string; status?: string }) {
    const assignments = await this.service.listForUser(filters);
    return { assignments };
  }

  async get(id: string) {
    const assignment = await this.service.getById(id);

    if (assignment && assignment.user_id !== this.userId) {
      throw forbidden("Assignment does not belong to the authenticated user.");
    }

    return { assignment: assignment ?? null };
  }
}
```

**Rules for controllers:**

- No raw Supabase calls.
- No `.from()`, `.select()`, `.update()`, or SQL expressions.
- Ownership checks belong here.
- REST error mapping belongs here or in shared middleware.

---

## Layer 3 - Services

**Single responsibility:** business rules and domain logic. Services do not know about Hono, HTTP status codes, or JSON response envelopes.

Services own:

- Last-write-wins conflict checks.
- Budget and allowance calculations.
- Free-time recommendation logic.
- Sync item dispatch and per-item failure handling.
- Data transformation before repository calls.

Services throw plain `Error` instances only. Controllers or global error middleware convert those into REST responses.

---

## Layer 4 - Repositories

**Single responsibility:** all Supabase database access.

Repositories own:

- `select`, `insert`, `upsert`, `update`, and soft-delete queries.
- `user_id` scoping.
- `deleted_at IS NULL` filters.
- Sorting, pagination, and date filters.
- Returning raw records to services/controllers.

Repositories must not:

- Decide whether a student is over budget.
- Compute schedule recommendations.
- Shape final HTTP responses.
- Swallow Supabase errors.

If Supabase returns an error, throw `new Error(error.message)`. If a `.single()` lookup returns PostgREST not-found code `PGRST116`, return `null`.

---

## REST Error Propagation Rules

All errors use the shared envelope:

```typescript
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
  };
}
```

| Layer | Error behavior |
| --- | --- |
| Route | Converts Zod failures to `VALIDATION_ERROR` 400 |
| Auth middleware | Returns `UNAUTHENTICATED` 401 before protected logic runs |
| Controller | Throws or returns domain-aware REST errors such as `FORBIDDEN` and `NOT_FOUND` |
| Service | Throws plain `Error` only |
| Repository | Throws plain `Error(error.message)` for Supabase failures |
| Global error handler | Converts uncaught errors to `INTERNAL_ERROR` 500 |

---

## Quick Reference

| Responsibility | Layer |
| --- | --- |
| Hono method/path declaration | Route |
| Bearer JWT auth guard | Middleware/Route |
| Zod request validation | Route |
| Ownership check | Controller |
| Response payload shape | Controller |
| Conflict resolution | Service |
| Forecast/free-time calculations | Service |
| Supabase queries | Repository |
| Error envelope formatting | Shared error middleware/helpers |

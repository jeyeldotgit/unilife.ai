# UniLife.AI — Backend Architecture Guide

## Router → Controller → Service → Repository

**Version:** 1.0 MVP  
**Scope:** `apps/backend/src/`  
**Stack:** Hono + tRPC + Supabase (service role client)

---

## Why 4 Layers on Top of tRPC

The LLD's current `routers/` files are doing too much in one place — parsing input, running business logic, and querying the database all in the same function. That works for a proof of concept, but breaks down the moment you need to:

- Reuse business logic across two procedures (e.g. `sync.push` and `assignments.create` both need to insert an assignment)
- Unit test business logic without spinning up a database
- Swap Supabase for a different DB client without touching logic
- Add consistent error handling in one place

The 4-layer split is the fix. Here is what each layer owns:

| Layer          | File location       | Owns                                                                                     | Does NOT own                     |
| -------------- | ------------------- | ---------------------------------------------------------------------------------------- | -------------------------------- |
| **Router**     | `routers/*.ts`      | tRPC procedure definitions, Zod input schemas, calling the controller                    | Business logic, DB access        |
| **Controller** | `controllers/*.ts`  | Orchestrating one request — validate preconditions, call service(s), shape the response  | DB queries, raw Supabase calls   |
| **Service**    | `services/*.ts`     | Business rules and domain logic — calculations, conflict checks, notification scheduling | How data is stored or retrieved  |
| **Repository** | `repositories/*.ts` | All Supabase queries — inserts, selects, updates, soft deletes                           | Business rules, response shaping |

---

## Updated File Structure

```text
apps/backend/
└── src/
    ├── index.ts                    # Hono app setup, CORS, tRPC mount
    ├── router.ts                   # Root tRPC router — assembles all sub-routers
    ├── trpc.ts                     # Context, publicProcedure, protectedProcedure
    │
    ├── routers/                    # Layer 1 — tRPC procedure declarations
    │   ├── health.ts
    │   ├── sync.ts
    │   ├── classes.ts
    │   ├── assignments.ts
    │   ├── exams.ts
    │   ├── expenses.ts
    │   ├── budgets.ts
    │   └── ai.ts
    │
    ├── controllers/                # Layer 2 — request orchestration
    │   ├── sync.controller.ts
    │   ├── classes.controller.ts
    │   ├── assignments.controller.ts
    │   ├── exams.controller.ts
    │   ├── expenses.controller.ts
    │   ├── budgets.controller.ts
    │   └── ai.controller.ts
    │
    ├── services/                   # Layer 3 — business logic
    │   ├── sync.service.ts
    │   ├── classes.service.ts
    │   ├── assignments.service.ts
    │   ├── exams.service.ts
    │   ├── expenses.service.ts
    │   ├── budgets.service.ts
    │   └── ai.service.ts
    │
    ├── repositories/               # Layer 4 — Supabase queries
    │   ├── classes.repository.ts
    │   ├── assignments.repository.ts
    │   ├── exams.repository.ts
    │   ├── expenses.repository.ts
    │   ├── budgets.repository.ts
    │   └── ai-logs.repository.ts
    │
    └── lib/
        └── supabase.ts             # Supabase admin client factory
```

---

## Layer Contracts

### How a request flows

```
tRPC Client
     │
     ▼
Router          ← validates input shape with Zod, calls controller
     │
     ▼
Controller      ← checks preconditions, calls service(s), shapes response
     │
     ▼
Service         ← applies business rules, calls repository
     │
     ▼
Repository      ← executes Supabase query, returns raw data
     │
     ▼
Supabase PostgreSQL
```

The controller never touches Supabase directly.  
The service never knows about tRPC or HTTP.  
The repository never makes business decisions.

---

---

## Layer 1 — Routers

**Single responsibility:** Declare the tRPC procedure, define the Zod input schema, extract validated input and `ctx.userId`, then hand off to the controller. Nothing else.

### Pattern

```typescript
// routers/assignments.ts
import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { AssignmentsController } from "../controllers/assignments.controller";

export const assignmentsRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        since: z.string().datetime().optional(),
        status: z.enum(["pending", "in_progress", "completed"]).optional(),
      }),
    )
    .query(({ ctx, input }) => {
      const controller = new AssignmentsController(ctx.supabase, ctx.userId);
      return controller.list(input);
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(({ ctx, input }) => {
      const controller = new AssignmentsController(ctx.supabase, ctx.userId);
      return controller.get(input.id);
    }),

  create: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        title: z.string().min(1).max(255),
        due_date: z.string().datetime(),
        class_id: z.string().uuid().optional(),
        description: z.string().max(2000).optional(),
        priority: z.number().int().min(1).max(3).optional(),
        created_at: z.string().datetime(),
        updated_at: z.string().datetime(),
      }),
    )
    .mutation(({ ctx, input }) => {
      const controller = new AssignmentsController(ctx.supabase, ctx.userId);
      return controller.create(input);
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        title: z.string().min(1).max(255).optional(),
        due_date: z.string().datetime().optional(),
        class_id: z.string().uuid().nullable().optional(),
        description: z.string().max(2000).nullable().optional(),
        status: z.enum(["pending", "in_progress", "completed"]).optional(),
        priority: z.number().int().min(1).max(3).optional(),
        updated_at: z.string().datetime(),
      }),
    )
    .mutation(({ ctx, input }) => {
      const controller = new AssignmentsController(ctx.supabase, ctx.userId);
      return controller.update(input.id, input);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(({ ctx, input }) => {
      const controller = new AssignmentsController(ctx.supabase, ctx.userId);
      return controller.delete(input.id);
    }),
});
```

**Rules for routers:**

- No `if` statements
- No direct Supabase calls
- No business logic — just schema + controller delegation
- All input schemas live here, not in controllers

---

---

## Layer 2 — Controllers

**Single responsibility:** Orchestrate one user-facing operation. Verify ownership preconditions, coordinate one or more service calls, and return the shaped response. The controller knows about the request context (userId) but not about SQL.

### Pattern

```typescript
// controllers/assignments.controller.ts
import type { SupabaseClient } from "@supabase/supabase-js";
import { TRPCError } from "@trpc/server";
import { AssignmentsService } from "../services/assignments.service";
import type { Assignment } from "@unilife/database-types";

export class AssignmentsController {
  private service: AssignmentsService;

  constructor(
    private supabase: SupabaseClient,
    private userId: string,
  ) {
    this.service = new AssignmentsService(supabase, userId);
  }

  async list(filters: { since?: string; status?: string }) {
    const assignments = await this.service.listForUser(filters);
    return { assignments };
  }

  async get(id: string) {
    const assignment = await this.service.getById(id);

    // Ownership check — service fetches by id only; controller enforces user scope
    if (assignment && assignment.user_id !== this.userId) {
      throw new TRPCError({ code: "FORBIDDEN" });
    }

    return { assignment: assignment ?? null };
  }

  async create(input: CreateAssignmentInput) {
    const assignment = await this.service.create(input);
    return { assignment };
  }

  async update(id: string, input: UpdateAssignmentInput) {
    // Verify the record exists and belongs to this user before updating
    const existing = await this.service.getById(id);
    if (!existing) throw new TRPCError({ code: "NOT_FOUND" });
    if (existing.user_id !== this.userId)
      throw new TRPCError({ code: "FORBIDDEN" });

    const updated = await this.service.update(id, input);
    return { assignment: updated };
  }

  async delete(id: string) {
    const existing = await this.service.getById(id);
    if (!existing) throw new TRPCError({ code: "NOT_FOUND" });
    if (existing.user_id !== this.userId)
      throw new TRPCError({ code: "FORBIDDEN" });

    await this.service.softDelete(id);
    return { ok: true };
  }
}
```

**Rules for controllers:**

- No SQL or Supabase client calls — delegate everything to the service
- Owns `TRPCError` throws (NOT_FOUND, FORBIDDEN, UNAUTHORIZED)
- May call multiple services for one operation (e.g. `ai.controller` calls both `AiService` and `AiLogsRepository`)
- No business logic — "is this over budget?" lives in the service, not here

---

---

## Layer 3 — Services

**Single responsibility:** Business rules and domain logic. The service is the only layer that knows what the app actually _means_ by an operation. It does not know what tRPC is. It does not throw HTTP/tRPC errors — it throws plain `Error` instances that the controller catches and re-wraps if needed.

### Pattern — Assignments

```typescript
// services/assignments.service.ts
import type { SupabaseClient } from "@supabase/supabase-js";
import { AssignmentsRepository } from "../repositories/assignments.repository";
import type { Assignment } from "@unilife/database-types";
import { nowISO } from "@unilife/shared";

export class AssignmentsService {
  private repo: AssignmentsRepository;

  constructor(
    supabase: SupabaseClient,
    private userId: string,
  ) {
    this.repo = new AssignmentsRepository(supabase);
  }

  async listForUser(filters: {
    since?: string;
    status?: string;
  }): Promise<Assignment[]> {
    return this.repo.findByUserId(this.userId, filters);
  }

  async getById(id: string): Promise<Assignment | null> {
    return this.repo.findById(id);
  }

  async create(input: CreateAssignmentInput): Promise<Assignment> {
    const record: Assignment = {
      ...input,
      user_id: this.userId,
      status: input.status ?? "pending",
      priority: input.priority ?? 1,
      description: input.description ?? null,
      class_id: input.class_id ?? null,
      deleted_at: null,
    };

    return this.repo.upsert(record);
  }

  async update(
    id: string,
    input: UpdateAssignmentInput,
  ): Promise<Assignment | null> {
    // Business rule: last-write-wins conflict resolution
    const existing = await this.repo.findById(id);
    if (!existing) return null;

    if (new Date(input.updated_at) <= new Date(existing.updated_at)) {
      // Payload is stale — server version wins, return existing
      return existing;
    }

    return this.repo.update(id, { ...input, updated_at: input.updated_at });
  }

  async softDelete(id: string): Promise<void> {
    await this.repo.softDelete(id, nowISO());
  }
}
```

### Pattern — Expenses Service (more business logic)

```typescript
// services/expenses.service.ts
import { ExpensesRepository } from "../repositories/expenses.repository";
import { BudgetsRepository } from "../repositories/budgets.repository";
import type { Expense, Budget } from "@unilife/database-types";

export class ExpensesService {
  private expensesRepo: ExpensesRepository;
  private budgetsRepo: BudgetsRepository;

  constructor(
    supabase: SupabaseClient,
    private userId: string,
  ) {
    this.expensesRepo = new ExpensesRepository(supabase);
    this.budgetsRepo = new BudgetsRepository(supabase);
  }

  async getActiveBudgetWithSpend(): Promise<{
    budget: Budget | null;
    spent: number;
    remaining: number;
  }> {
    const today = new Date().toISOString().split("T")[0];
    const budget = await this.budgetsRepo.findActiveForUser(this.userId, today);

    if (!budget) return { budget: null, spent: 0, remaining: 0 };

    const expenses = await this.expensesRepo.findByBudgetPeriod(
      this.userId,
      budget.start_date,
      budget.end_date,
    );

    const spent = expenses.reduce((sum, e) => sum + e.amount, 0);
    const remaining = budget.amount - spent;

    return { budget, spent, remaining };
  }

  async computeForecast(userId: string): Promise<AllowanceForecast> {
    const { budget, spent, remaining } = await this.getActiveBudgetWithSpend();
    if (!budget) throw new Error("No active budget found");

    const today = new Date();
    const endDate = new Date(budget.end_date);
    const daysLeftInCycle = Math.ceil(
      (endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );

    // Compute average from the last 7 days of expenses (or the cycle so far)
    const recentExpenses = await this.expensesRepo.findLast7Days(userId);
    const avgDailySpend =
      recentExpenses.length > 0
        ? recentExpenses.reduce((s, e) => s + e.amount, 0) / 7
        : spent / Math.max(1, 14 - daysLeftInCycle);

    const projectedRunoutDays =
      avgDailySpend > 0
        ? Math.floor(remaining / avgDailySpend)
        : daysLeftInCycle;

    const recommendedDailyLimit =
      daysLeftInCycle > 0 ? remaining / daysLeftInCycle : 0;

    return {
      remaining,
      daysLeftInCycle,
      avgDailySpend,
      projectedRunoutDays,
      recommendedDailyLimit,
    };
  }
}
```

### Pattern — Sync Service (the most complex one)

```typescript
// services/sync.service.ts
import { ClassesRepository } from "../repositories/classes.repository";
import { AssignmentsRepository } from "../repositories/assignments.repository";
import { ExamsRepository } from "../repositories/exams.repository";
import { ExpensesRepository } from "../repositories/expenses.repository";
import { BudgetsRepository } from "../repositories/budgets.repository";
import type { SyncQueueItem } from "@unilife/database-types";

export class SyncService {
  private repos: Record<string, EntityRepository>;

  constructor(supabase: SupabaseClient) {
    this.repos = {
      class: new ClassesRepository(supabase),
      assignment: new AssignmentsRepository(supabase),
      exam: new ExamsRepository(supabase),
      expense: new ExpensesRepository(supabase),
      budget: new BudgetsRepository(supabase),
    };
  }

  async pushItems(items: SyncQueueItem[]): Promise<{
    synced: string[];
    failed: string[];
  }> {
    const synced: string[] = [];
    const failed: string[] = [];

    for (const item of items) {
      try {
        await this.applyItem(item);
        synced.push(item.id);
      } catch (err) {
        failed.push(item.id);
      }
    }

    return { synced, failed };
  }

  private async applyItem(item: SyncQueueItem): Promise<void> {
    const repo = this.repos[item.entity_type];
    if (!repo) throw new Error(`Unknown entity type: ${item.entity_type}`);

    switch (item.operation) {
      case "create":
        await repo.upsert(item.payload);
        break;
      case "update":
        // Last-write-wins: only apply if payload is newer than stored record
        const existing = await repo.findById(item.entity_id);
        if (!existing) {
          // Record doesn't exist on server yet — treat as create
          await repo.upsert(item.payload);
        } else if (
          new Date(item.payload.updated_at as string) >
          new Date(existing.updated_at)
        ) {
          await repo.update(item.entity_id, item.payload);
        }
        // else: server version is newer, silently skip
        break;
      case "delete":
        await repo.softDelete(item.entity_id, new Date().toISOString());
        break;
    }
  }
}
```

**Rules for services:**

- No `TRPCError` — throw plain `Error` or custom domain errors
- No Supabase client directly — always through a repository
- Business rules live here: last-write-wins logic, budget calculations, forecast math, AI context assembly
- May call multiple repositories
- Should be independently testable with a mocked repository

---

---

## Layer 4 — Repositories

**Single responsibility:** Execute Supabase queries. One repository per database table. No business logic — just CRUD. Always scoped to `user_id` where applicable.

### Pattern

```typescript
// repositories/assignments.repository.ts
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Assignment } from "@unilife/database-types";

export class AssignmentsRepository {
  constructor(private supabase: SupabaseClient) {}

  async findByUserId(
    userId: string,
    filters: { since?: string; status?: string },
  ): Promise<Assignment[]> {
    let query = this.supabase
      .from("assignments")
      .select("*")
      .eq("user_id", userId)
      .is("deleted_at", null)
      .order("due_date", { ascending: true });

    if (filters.since) {
      query = query.gt("updated_at", filters.since);
    }
    if (filters.status) {
      query = query.eq("status", filters.status);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data as Assignment[];
  }

  async findById(id: string): Promise<Assignment | null> {
    const { data, error } = await this.supabase
      .from("assignments")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // not found
      throw new Error(error.message);
    }
    return data as Assignment;
  }

  async upsert(record: Assignment): Promise<Assignment> {
    const { data, error } = await this.supabase
      .from("assignments")
      .upsert(record, { onConflict: "id" })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Assignment;
  }

  async update(id: string, fields: Partial<Assignment>): Promise<Assignment> {
    const { data, error } = await this.supabase
      .from("assignments")
      .update(fields)
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Assignment;
  }

  async softDelete(id: string, deletedAt: string): Promise<void> {
    const { error } = await this.supabase
      .from("assignments")
      .update({ deleted_at: deletedAt })
      .eq("id", id);

    if (error) throw new Error(error.message);
  }
}
```

```typescript
// repositories/expenses.repository.ts
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Expense } from "@unilife/database-types";

export class ExpensesRepository {
  constructor(private supabase: SupabaseClient) {}

  async findByBudgetPeriod(
    userId: string,
    startDate: string,
    endDate: string,
  ): Promise<Expense[]> {
    const { data, error } = await this.supabase
      .from("expenses")
      .select("*")
      .eq("user_id", userId)
      .is("deleted_at", null)
      .gte("spent_at", startDate)
      .lte("spent_at", endDate);

    if (error) throw new Error(error.message);
    return data as Expense[];
  }

  async findLast7Days(userId: string): Promise<Expense[]> {
    const since = new Date();
    since.setDate(since.getDate() - 7);

    const { data, error } = await this.supabase
      .from("expenses")
      .select("*")
      .eq("user_id", userId)
      .is("deleted_at", null)
      .gte("spent_at", since.toISOString());

    if (error) throw new Error(error.message);
    return data as Expense[];
  }

  async upsert(record: Expense): Promise<Expense> {
    const { data, error } = await this.supabase
      .from("expenses")
      .upsert(record, { onConflict: "id" })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Expense;
  }

  async softDelete(id: string, deletedAt: string): Promise<void> {
    const { error } = await this.supabase
      .from("expenses")
      .update({ deleted_at: deletedAt })
      .eq("id", id);

    if (error) throw new Error(error.message);
  }
}
```

**Rules for repositories:**

- Every method is one Supabase query (or a transaction for multi-step operations)
- Always throw a plain `Error` on Supabase error — never swallow them
- Never contain `if (businessCondition)` logic
- All `SELECT` queries filter by `deleted_at IS NULL` unless explicitly fetching deleted records
- Method names describe the data shape: `findByUserId`, `findActiveForUser`, `findLast7Days` — not `get`, `fetch`

---

---

## The AI Router — How All 4 Layers Work Together

The AI flow is the most complex because it touches multiple concerns in one call. Here is how it decomposes:

```
ai.chat (router)
  └── AiController.chat()
        ├── assembles context (no DB call — context is sent from client)
        ├── AiService.processMessage()
        │     ├── calls GeminiClient.send() [packages/ai-core]
        │     └── parses + validates structured JSON response
        └── AiLogsRepository.insert() — fire and forget logging
```

```typescript
// controllers/ai.controller.ts
export class AiController {
  constructor(
    private supabase: SupabaseClient,
    private userId: string,
  ) {}

  async chat(input: AiChatInput): Promise<AiChatResponse> {
    const aiService = new AiService();
    const aiLogsRepo = new AiLogsRepository(this.supabase);

    let result: AiChatResponse;

    try {
      result = await aiService.processMessage(input.message, input.context);
    } catch (err) {
      // Gemini unavailable — return graceful fallback, don't throw 500
      result = {
        intent: "unknown",
        action: null,
        message: "I couldn't process that right now. Try again in a moment.",
        requires_confirmation: false,
      };
    }

    // Log asynchronously — don't block the response
    aiLogsRepo
      .insert({
        id: crypto.randomUUID(),
        user_id: this.userId,
        raw_input: input.message,
        detected_intent: result.intent,
        confidence: null,
        processing_layer: "gemini",
        structured_output: result.action,
        error: null,
        created_at: new Date().toISOString(),
      })
      .catch(() => {
        /* logging failure should never crash the request */
      });

    return result;
  }
}
```

```typescript
// services/ai.service.ts
import { callGemini } from "@unilife/ai-core";

export class AiService {
  async processMessage(
    message: string,
    context: AiContext,
  ): Promise<AiChatResponse> {
    const systemPrompt = buildSystemPrompt(); // from packages/ai-core
    const response = await callGemini({ message, systemPrompt, context });

    // Parse and validate the JSON response
    const parsed = JSON.parse(response.text);
    const validated = AiResponseSchema.parse(parsed); // Zod schema

    return {
      intent: validated.intent,
      action: validated.action ?? null,
      message: validated.message,
      forecast: validated.forecast ?? undefined,
      free_time: validated.free_time ?? undefined,
      requires_confirmation: CONFIRMATION_REQUIRED_INTENTS.includes(
        validated.intent,
      ),
    };
  }
}
```

---

---

## Supabase Client — Shared Setup

The Supabase client is created once per request in `createContext` (already defined in LLD §7.3) and passed down through the constructor chain. No singleton — because the service role client is stateless and cheap to instantiate.

```typescript
// lib/supabase.ts
import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

export function createSupabaseAdminClient(): SupabaseClient {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}
```

Every repository receives the Supabase client via constructor injection — making it trivially mockable in tests:

```typescript
// In a test
const mockSupabase = createMockSupabaseClient();
const repo = new AssignmentsRepository(mockSupabase);
```

---

---

## Error Propagation Rules

```
Repository   →  throws plain Error("supabase error message")
     ↓
Service      →  catches repository errors if recovery is possible;
                otherwise re-throws plain Error
                may throw domain errors: new Error("NO_ACTIVE_BUDGET")
     ↓
Controller   →  catches service errors, maps to TRPCError:
                  "NO_ACTIVE_BUDGET" → TRPCError({ code: "BAD_REQUEST" })
                  "record not found" → TRPCError({ code: "NOT_FOUND" })
                  Gemini timeout     → graceful fallback, no throw
     ↓
Router       →  tRPC handles TRPCError automatically; unhandled errors
                become INTERNAL_SERVER_ERROR
```

---

---

## Quick Reference — Who Does What

| Concern                                     | Layer                                       |
| ------------------------------------------- | ------------------------------------------- |
| Zod input schema                            | Router                                      |
| `protectedProcedure` guard                  | Router                                      |
| `TRPCError` (FORBIDDEN, NOT_FOUND)          | Controller                                  |
| Ownership check (userId === record.user_id) | Controller                                  |
| Last-write-wins conflict resolution         | Service                                     |
| Budget remaining calculation                | Service                                     |
| Allowance forecast math                     | Service                                     |
| AI context assembly                         | Service                                     |
| Gemini API call                             | Service → ai-core package                   |
| AI response parsing & validation            | Service                                     |
| SELECT / INSERT / UPDATE / DELETE           | Repository                                  |
| Soft delete (`deleted_at`)                  | Repository                                  |
| `user_id` filter on all queries             | Repository                                  |
| AI interaction logging                      | Controller (fire-and-forget via Repository) |

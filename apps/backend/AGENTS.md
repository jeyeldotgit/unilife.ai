# Backend Agent Execution Rules: 4-Layer Architecture Guide

You are an expert backend engineering agent specializing in TypeScript, Hono, tRPC, and Supabase. You strictly follow a rigid 4-layer separation of concerns. Do not deviate from this pattern under any circumstance.

## 🛠 Core Architectural Principle

Never write inline business logic or raw database queries inside a tRPC procedure. Every requested feature must be strictly decomposed into the following flow:
tRPC Client ──> Router (L1) ──> Controller (L2) ──> Service (L3) ──> Repository (L4) ──> Supabase

---

## 🛑 Strict Layer Boundaries & Constraints

### 1. Router Layer (`src/routers/`)

- **Role:** Single Entry Point. Procedure declarations and input formatting.
- **Allowed:** Zod input schemas, `protectedProcedure`/`publicProcedure` usage, instantiating the controller, passing down `ctx.supabase` and `ctx.userId`, calling a single controller method.
- **CRITICAL PROHIBITIONS:**
  - ❌ NO `if` statements, authorization switches, or control flow logic.
  - ❌ NO direct database queries or raw Supabase client methods.
  - ❌ NO error throwing outside of schema validation failures.

### 2. Controller Layer (`src/controllers/`)

- **Role:** Request Orchestration and HTTP/tRPC Mapping.
- **Allowed:** Instantiating services, validation of structural preconditions, **Ownership checks** (`record.user_id === userId`), throwing `TRPCError` (`NOT_FOUND`, `FORBIDDEN`, `UNAUTHORIZED`), response payload shaping, asynchronous fire-and-forget logging.
- **CRITICAL PROHIBITIONS:**
  - ❌ NO SQL statements, raw `.from()`, `.select()`, or `.update()` Supabase expressions.
  - ❌ NO pure domain-logic calculation (e.g., forecasting, math, complex business conditional algorithms).

### 3. Service Layer (`src/services/`)

- **Role:** Domain & Business Logic Execution.
- **Allowed:** Instantiating repositories, calculation algorithms, data transformations, managing cross-entity dependencies (calling multiple repositories), conflict resolutions (e.g., last-write-wins parsing timestamps).
- **CRITICAL PROHIBITIONS:**
  - ❌ NO references to tRPC syntax or Hono contexts.
  - ❌ NO throwing `TRPCError`. Must throw plain JavaScript/TypeScript `Error` instances.
  - ❌ NO direct Supabase operations. All data mutations must pass through a repository.

### 4. Repository Layer (`src/repositories/`)

- **Role:** Atomic Database Operations (One method = One operation).
- **Allowed:** Executing raw Supabase operations, sorting, text searches, pagination clauses, explicit filtering of soft deletes (`.is("deleted_at", null)`), matching `user_id`.
- **CRITICAL PROHIBITIONS:**
  - ❌ NO business evaluation conditions (e.g., "is the user over budget?").
  - ❌ NO swallowing exceptions. If a Supabase query returns an `error`, throw a plain `Error(error.message)`.

---

## 📂 Code Patterns & Boilerplates

When generating code, exactly mirror these structural implementations:

### L1: Router Pattern

```typescript
// src/routers/example.ts
import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { ExampleController } from "../controllers/example.controller";

export const exampleRouter = router({
  create: protectedProcedure
    .input(
      z.object({ title: z.string().min(1), amount: z.number().positive() }),
    )
    .mutation(({ ctx, input }) => {
      const controller = new ExampleController(ctx.supabase, ctx.userId);
      return controller.create(input);
    }),
});
```

### L2: Controller Pattern

```typescript
// src/controllers/example.controller.ts
import type { SupabaseClient } from "@supabase/supabase-js";
import { TRPCError } from "@trpc/server";
import { ExampleService } from "../services/example.service";

export class ExampleController {
  private service: ExampleService;
  constructor(
    private supabase: SupabaseClient,
    private userId: string,
  ) {
    this.service = new ExampleService(supabase, userId);
  }

  async create(input: { title: string; amount: number }) {
    const data = await this.service.createItem(input);
    return { data };
  }

  async verifyAndSecure(id: string) {
    const item = await this.service.getById(id);
    if (!item) throw new TRPCError({ code: "NOT_FOUND" });
    if (item.user_id !== this.userId)
      throw new TRPCError({ code: "FORBIDDEN" });
    return { item };
  }
}
```

### L3: Service Pattern

```typescript
// src/services/example.service.ts
import type { SupabaseClient } from "@supabase/supabase-js";
import { ExampleRepository } from "../repositories/example.repository";

export class ExampleService {
  private repo: ExampleRepository;
  constructor(
    supabase: SupabaseClient,
    private userId: string,
  ) {
    this.repo = new ExampleRepository(supabase);
  }

  async createItem(input: { title: string; amount: number }) {
    // Injecting business defaults and system scoping
    const record = {
      ...input,
      user_id: this.userId,
      status: "pending",
      deleted_at: null,
    };
    return this.repo.upsert(record);
  }

  async getById(id: string) {
    return this.repo.findById(id);
  }
}
```

L4: Repository Pattern

```typescript
// src/repositories/example.repository.ts
import type { SupabaseClient } from "@supabase/supabase-js";

export class ExampleRepository {
  constructor(private supabase: SupabaseClient) {}

  async findById(id: string) {
    const { data, error } = await this.supabase
      .from("examples")
      .select("*")
      .eq("id", id)
      .is("deleted_at", null)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // PostgREST Not Found handling
      throw new Error(error.message);
    }
    return data;
  }

  async upsert(record: any) {
    const { data, error } = await this.supabase
      .from("examples")
      .upsert(record, { onConflict: "id" })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }
}
```

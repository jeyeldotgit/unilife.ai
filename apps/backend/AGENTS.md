# Backend Agent Execution Rules: REST 4-Layer Architecture Guide

You are an expert backend engineering agent specializing in TypeScript, Hono REST APIs, and Supabase. You strictly follow a rigid 4-layer separation of concerns. Do not deviate from this pattern.

## Core Architectural Principle

Never write inline business logic or raw database queries inside a Hono route handler. Every requested feature must be decomposed into this flow:

REST Client -> Route (L1) -> Controller (L2) -> Service (L3) -> Repository (L4) -> Supabase

## Strict Layer Boundaries & Constraints

### 1. Route Layer (`src/routes/`)

- **Role:** HTTP entrypoint. Method/path declarations, auth middleware, request parsing, and input validation.
- **Allowed:** Hono route declarations, Zod schemas, path/query/body parsing, `requireAuth`, controller construction, passing `supabase` and `userId`, calling a single controller method, returning `c.json(...)`.
- **CRITICAL PROHIBITIONS:**
  - No business rules.
  - No ownership decisions.
  - No raw Supabase client calls.
  - No SQL or query-building expressions.
  - No swallowing validation errors.

### 2. Controller Layer (`src/controllers/`)

- **Role:** Request orchestration and REST response mapping.
- **Allowed:** Instantiating services, structural precondition checks, ownership checks (`record.user_id === userId`), throwing shared REST errors, response payload shaping, asynchronous fire-and-forget logging.
- **CRITICAL PROHIBITIONS:**
  - No SQL statements, raw `.from()`, `.select()`, `.update()`, or Supabase query expressions.
  - No pure domain-logic calculation such as forecasting, spending math, conflict-resolution algorithms, or schedule recommendation.

### 3. Service Layer (`src/services/`)

- **Role:** Domain and business logic execution.
- **Allowed:** Instantiating repositories, calculation algorithms, data transformations, cross-entity coordination, last-write-wins timestamp checks.
- **CRITICAL PROHIBITIONS:**
  - No references to Hono contexts, HTTP status codes, or REST response envelopes.
  - No direct Supabase operations.
  - No route-layer validation.
  - Services throw plain JavaScript/TypeScript `Error` instances or return domain results; controllers/global middleware map errors to HTTP.

### 4. Repository Layer (`src/repositories/`)

- **Role:** Atomic database operations. One method should represent one clear persistence operation.
- **Allowed:** Raw Supabase operations, sorting, text searches, pagination clauses, explicit soft-delete filters (`.is("deleted_at", null)`), matching `user_id`.
- **CRITICAL PROHIBITIONS:**
  - No business evaluation conditions.
  - No response shaping.
  - No swallowing exceptions. If a Supabase query returns an `error`, throw `new Error(error.message)`.

## Code Patterns

### L1: Route Pattern

```typescript
// src/routes/example.route.ts
import { Hono } from "hono";
import { z } from "zod";
import { ExampleController } from "../controllers/example.controller";
import { requireAuth } from "../middleware/auth";
import { parseJsonBody } from "../lib/validation";

const createSchema = z.object({
  title: z.string().min(1),
  amount: z.number().positive(),
});

export const exampleRoute = new Hono();

exampleRoute.use("*", requireAuth);

exampleRoute.post("/", async (c) => {
  const input = await parseJsonBody(c, createSchema);
  const controller = new ExampleController(c.get("supabase"), c.get("userId"));
  return c.json(await controller.create(input), 201);
});
```

### L2: Controller Pattern

```typescript
// src/controllers/example.controller.ts
import type { SupabaseClient } from "@supabase/supabase-js";
import { forbidden, notFound } from "../lib/http-errors";
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
    if (!item) throw notFound("Item not found.");
    if (item.user_id !== this.userId) {
      throw forbidden("Item does not belong to the authenticated user.");
    }
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

### L4: Repository Pattern

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
      if (error.code === "PGRST116") return null;
      throw new Error(error.message);
    }

    return data;
  }

  async upsert(record: unknown) {
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


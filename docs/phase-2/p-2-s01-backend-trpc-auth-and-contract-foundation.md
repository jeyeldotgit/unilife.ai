# P2-S01 Backend tRPC Auth and Contract Foundation

## I. Meta Specifications

**Spec Name:** P2-S01-backend-trpc-auth-and-contract-foundation  
**Phase:** Phase 2  
**Responsibility:** Establish the backend runtime, tRPC contract, authentication context, and layer rules that all Phase 2 protected APIs depend on.

## II. System Dependencies & Architectural Context

**Upstream Dependencies:**
- Existing `apps/backend` Hono health vertical slice.
- Supabase project with MVP schema and RLS already applied directly.

**Downstream Dependents:**
- P2-S02 academic CRUD.
- P2-S03 finance CRUD.
- P2-S04 offline sync push.
- P2-S05 AI chat.

**Inputs (Reference Materials):**
- `apps/backend/AGENTS.md`
- `docs/core/BACKEND_ARCH.md`
- `docs/core/ENDPOINT_REF.md`
- `docs/core/LLD.md`
- `docs/core/STORYBOARD.md`

**Resolved Gaps:**
- The admin-auth example is a format reference only; Phase 2 backend scope is the UniLife MVP tRPC backend.
- The real implementation target is `apps/backend`, not any alternate API path.
- The existing backend is Hono REST-style; this spec converts the shell to Hono + tRPC while preserving `/health`.
- Supabase DDL/RLS is assumed applied manually; this spec requires runtime alignment checks, not migration generation.

## III. Scope Boundaries

### A. In-Scope Elements

- Hono app setup with CORS and deployment health route.
- tRPC mount at `/api/trpc/*`.
- Root `appRouter` with `health` router wired.
- `src/trpc.ts` exporting:
  - `router`
  - `publicProcedure`
  - `protectedProcedure`
  - `createContext`
  - `TRPCContext`
- Supabase service-role client factory shared by all repositories and auth context.
- JWT extraction from `Authorization: Bearer <supabase_jwt>`.
- Supabase Auth `getUser(token)` validation.
- Stable `ctx.userId` injection for protected procedures.
- Standard tRPC error behavior for:
  - `UNAUTHORIZED`
  - `FORBIDDEN`
  - `NOT_FOUND`
  - `BAD_REQUEST`
  - `INTERNAL_SERVER_ERROR`
- Backend layer contract enforcement from `apps/backend/AGENTS.md`.

### B. Out-of-Scope Elements

- CRUD implementation for academic, finance, sync, or AI procedures.
- Frontend tRPC client wiring.
- Supabase migration generation.
- Admin-only routes or role-based admin authorization.

## IV. Technical Delivery Requirements

### A. Artifacts & Deliverables to Produce

- `apps/backend/src/trpc.ts`
- `apps/backend/src/lib/supabase.ts`
- `apps/backend/src/routers/health.ts`
- Updated `apps/backend/src/router.ts` exporting `appRouter` and `AppRouter`.
- Updated Hono entrypoint wiring `/health` and `/api/trpc/*`.
- Protected procedure middleware that rejects missing or invalid JWTs.
- Public health tRPC procedure:
  - `health.ping`
  - response: `{ ok: true, timestamp: string }`
- Build-compatible TypeScript exports for downstream routers.

### B. Core Implementation Constraints

- `protectedProcedure` is the only auth gate for protected tRPC procedures.
- No protected procedure may execute controller, service, or repository logic before auth succeeds.
- Supabase service-role client must be created from environment variables and passed by dependency injection.
- Repositories receive a Supabase client; they must not create their own hidden clients.
- Routers may define Zod schemas and call one controller method only.
- Controllers map request orchestration and tRPC errors.
- Services contain business logic and throw plain `Error` only.
- Repositories own raw Supabase queries and throw plain `Error(error.message)` on Supabase failures.

### C. Runtime Configuration

Required backend environment variables:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `FRONTEND_URL` for CORS, with a documented local fallback if absent.

The existing `DATABASE_URL` health check may remain as a database reachability signal, but it must not replace Supabase auth validation for protected procedures.

## V. Validation & Exit Criteria

A successful implementation must verifiably satisfy:

- `/health` returns HTTP 200 without authentication.
- `health.ping` returns `{ ok: true, timestamp }` through tRPC without authentication.
- Missing JWT on any protected procedure returns tRPC `UNAUTHORIZED` and HTTP 401.
- Invalid or expired JWT returns tRPC `UNAUTHORIZED` and HTTP 401.
- Valid JWT injects a non-null `ctx.userId` into protected procedures.
- Downstream routers can import `router`, `publicProcedure`, and `protectedProcedure` without circular dependency issues.
- `pnpm --filter @unilife-ai/backend build` succeeds.

## VI. Required Tests

- Build check: `pnpm --filter @unilife-ai/backend build`.
- Auth gating tests for one placeholder protected procedure or test router.
- Public health tests for `/health` and `health.ping`.
- Context tests covering missing token, invalid token, and valid token with mocked Supabase Auth.


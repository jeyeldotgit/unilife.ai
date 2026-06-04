# P2-S01 Backend REST Auth and Contract Foundation

## I. Meta Specifications

**Spec Name:** P2-S01-backend-rest-auth-and-contract-foundation  
**Phase:** Phase 2  
**Responsibility:** Establish the backend REST runtime, authentication context, error envelope, and layer rules that all Phase 2 protected APIs depend on.

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
- The admin-auth example is a format reference only; Phase 2 backend scope is the UniLife MVP REST backend.
- The real implementation target is `apps/backend`, not any alternate API path.
- The existing backend is already Hono REST-style; this spec keeps REST as the permanent backend transport.
- Supabase DDL/RLS is assumed applied manually; this spec requires runtime alignment checks, not migration generation.

## III. Scope Boundaries

### A. In-Scope Elements

- Hono app setup with CORS and deployment health route.
- REST route mounting under `/api/*`.
- Root route registration through `apps/backend/src/router.ts`.
- Shared auth middleware that attaches the authenticated Supabase user ID to the Hono request context.
- Supabase service-role client factory shared by all repositories and auth context.
- JWT extraction from `Authorization: Bearer <supabase_jwt>`.
- Supabase Auth `getUser(token)` validation.
- Stable `userId` context injection for protected handlers.
- Standard REST error envelope with stable app codes:
  - `UNAUTHENTICATED`
  - `FORBIDDEN`
  - `NOT_FOUND`
  - `VALIDATION_ERROR`
  - `CONFLICT`
  - `EXTERNAL_SERVICE_UNAVAILABLE`
  - `INTERNAL_ERROR`
- Backend layer contract enforcement from `apps/backend/AGENTS.md`.

### B. Out-of-Scope Elements

- CRUD implementation for academic, finance, sync, or AI endpoints.
- Frontend API client wiring.
- Supabase migration generation.
- Admin-only routes or role-based admin authorization.

## IV. Technical Delivery Requirements

### A. Artifacts & Deliverables to Produce

- `apps/backend/src/middleware/auth.ts`
- `apps/backend/src/lib/http-errors.ts`
- `apps/backend/src/lib/supabase.ts`
- `apps/backend/src/routes/health.route.ts`
- Updated `apps/backend/src/router.ts` registering REST route groups.
- Updated Hono app wiring `/health` and `/api/*`.
- Protected route middleware that rejects missing or invalid JWTs.
- Public health REST endpoint:
  - `GET /health`
  - response: `{ ok: true, timestamp: string }`
- Build-compatible TypeScript exports for downstream route groups.

### B. Core Implementation Constraints

- Auth middleware is the only auth gate for protected REST route groups.
- No protected endpoint may execute controller, service, or repository logic before auth succeeds.
- Supabase service-role client must be created from environment variables and passed by dependency injection.
- Repositories receive a Supabase client; they must not create their own hidden clients.
- Routes may define Zod schemas, parse path/query/body input, and call one controller method only.
- Controllers map request orchestration and REST errors.
- Services contain business logic and throw plain `Error` only.
- Repositories own raw Supabase queries and throw plain `Error(error.message)` on Supabase failures.

### C. Runtime Configuration

Required backend environment variables:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `FRONTEND_URL` for CORS, with a documented local fallback if absent.

The existing `DATABASE_URL` health check may remain as a database reachability signal, but it must not replace Supabase auth validation for protected endpoints.

## V. Validation & Exit Criteria

A successful implementation must verifiably satisfy:

- `/health` returns HTTP 200 without authentication.
- Missing JWT on any protected endpoint returns `UNAUTHENTICATED` and HTTP 401.
- Invalid or expired JWT returns `UNAUTHENTICATED` and HTTP 401.
- Valid JWT injects a non-null authenticated user ID into protected handlers.
- Downstream route groups can import auth middleware, Supabase client helpers, and error helpers without circular dependency issues.
- `pnpm --filter @unilife-ai/backend build` succeeds.

## VI. Required Tests

- Build check: `pnpm --filter @unilife-ai/backend build`.
- Auth gating tests for one placeholder protected route or test route group.
- Public health tests for `/health`.
- Context tests covering missing token, invalid token, and valid token with mocked Supabase Auth.

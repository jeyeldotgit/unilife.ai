# P4-S06 Daily Briefing Free Time and Allowance Planning

## I. Meta Specifications

**Spec Name:** P4-S06-daily-briefing-free-time-and-allowance-planning  
**Phase:** Phase 4  
**Responsibility:** Deliver the planning features that make UniLife.AI feel like a real student companion: daily briefing, free-time recommendations, and allowance forecasting grounded in real user data.

## II. System Dependencies & Architectural Context

**Upstream Dependencies:**
- `P4-S01` real online data adapters.
- `P4-S02` exams feature parity.
- `P4-S03` reliable local/offline state.
- `P4-S04` local parser and online AI split.
- `P2-S05` backend AI chat foundations.

**Inputs (Reference Materials):**
- `docs/core/PRD.md`
- `docs/core/STORYBOARD.md`
- `docs/core/ENDPOINT_REF.md`
- `docs/core/LLD.md`
- `packages/ai-core/src/prompts/system-prompt.ts`
- `apps/backend/src/routes/ai.route.ts`
- `apps/backend/src/services/ai.service.ts`
- `apps/frontend/src/app/(app)/dashboard/*`
- `apps/frontend/src/app/(app)/chat/*`
- `apps/frontend/src/lib/api/chat.ts`
- `apps/frontend/src/lib/api/budget.ts`

**Resolved Gaps:**
- The current product has CRUD foundations, but the companion layer is still underpowered relative to the PRD.
- Planning features must combine deterministic calculations with AI-generated language instead of delegating everything blindly to the model.
- When AI is unavailable, the student should still receive a useful fallback ranking or summary rather than a dead feature.

## III. Scope Boundaries

### A. In-Scope Elements

- Daily briefing generation for the dashboard.
- Free-time recommendation behavior in chat.
- Allowance forecast behavior in chat and/or dashboard entry points.
- Deterministic planning helpers for:
  - next class lookup
  - free-window computation
  - deadline ranking
  - average daily spend and runout projection
- Backend AI prompt and service enhancements required to support these planning experiences.
- Fallback behavior when AI is unavailable or context is incomplete.

### B. Out-of-Scope Elements

- Premium study tutor features.
- Quiz generation, flashcards, or note summarization.
- University or LMS integrations.

## IV. Technical Delivery Requirements

### A. Artifacts & Deliverables to Produce

- Backend AI route/service updates needed to support richer planning responses.
- `packages/ai-core/src/prompts/daily-briefing-prompt.ts` - create if not already present.
- Frontend dashboard data-shaping and rendering updates for the daily briefing experience.
- Chat adapter/client updates for free-time and allowance-planning prompts and responses.
- Any shared types required for briefing, forecast, or recommendation payloads.

### B. Core Implementation Constraints

- Planning logic must not rely on the model alone for values that can be deterministically calculated from known inputs.
- AI-generated messaging must be grounded in explicit frontend- or backend-supplied context.
- If the AI layer fails, the app must still provide a deterministic fallback summary or ranking whenever enough local data exists.
- Daily briefing must remain fast enough for dashboard-first usage and must not block the entire route behind a slow AI dependency.
- Free-time recommendations must consider both assignments and exams when ranking work.
- Allowance forecast calculations must use real budget cycle and spending data, not placeholders.

### C. Feature Expectations

At minimum the implementation must support:

- A daily dashboard briefing that summarizes:
  - today's classes
  - upcoming deadlines
  - budget status
  - one recommended focus item
- A chat response for "what should I do right now?" that:
  - identifies the free window
  - names the next class if any
  - ranks relevant assignments and exams
- A chat or dashboard-triggered allowance forecast that:
  - estimates whether the budget will last through the cycle
  - reports average daily spend
  - suggests a safer daily limit when appropriate

## V. Validation & Exit Criteria

A successful implementation must verifiably satisfy:

- The dashboard shows a real, data-grounded daily briefing rather than static placeholder text.
- Free-time recommendation responses are based on actual schedule and deadline context.
- Allowance forecast responses include meaningful computed values when budget data is available.
- AI outages degrade into deterministic fallback summaries instead of fatal errors.
- `pnpm --filter @unilife-ai/backend build` and `pnpm --filter @unilife-ai/frontend build` succeed.

## VI. Required Tests

- Build checks:
  - `pnpm --filter @unilife-ai/backend build`
  - `pnpm --filter @unilife-ai/frontend build`
- Backend service coverage for:
  - free-window calculation
  - deadline ranking
  - allowance forecast calculation
  - AI fallback behavior
- Frontend regression coverage that planning payloads remain serializable and render without route crashes.

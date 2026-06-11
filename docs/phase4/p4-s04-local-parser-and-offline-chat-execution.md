# P4-S04 Local Parser and Offline Chat Execution

## I. Meta Specifications

**Spec Name:** P4-S04-local-parser-and-offline-chat-execution  
**Phase:** Phase 4  
**Responsibility:** Build the local parser package and connect it to the chat experience so offline students can still execute simple intents and receive structured confirmations.

## II. System Dependencies & Architectural Context

**Upstream Dependencies:**
- `P4-S03` sync queue lifecycle and Dexie persistence.
- `P4-S01` real online API adapters.
- `P2-S05` AI chat contract for the online path.

**Downstream Dependents:**
- `P4-S06` planning flows that need a credible split between local deterministic behavior and cloud AI reasoning.

**Inputs (Reference Materials):**
- `docs/core/PRD.md`
- `docs/core/LLD.md`
- `docs/core/STORYBOARD.md`
- `apps/frontend/src/actions/chat.ts`
- `apps/frontend/src/app/(app)/chat/ChatClient.tsx`
- `apps/frontend/src/lib/api/chat.ts`
- `apps/frontend/src/lib/db/dexie.ts`
- `packages/shared/src/constants.ts`

**Resolved Gaps:**
- The current offline chat fallback is message-only and does not perform local CRUD actions.
- The LLD already defines a `packages/parser` boundary; Phase 4 should implement that intent rather than keeping parsing embedded in UI code.
- Local parser confidence rules determine whether the app executes locally or defers to online AI when available.

## III. Scope Boundaries

### A. In-Scope Elements

- `packages/parser` package creation and implementation.
- English and Filipino support for simple deterministic intents.
- Offline chat execution for:
  - `create_assignment`
  - `create_class`
  - `create_exam`
  - `log_expense`
  - `query_deadlines`
- Local Dexie writes plus sync queue creation for offline CRUD intents.
- Chat confirmation messages that mirror the established UI message taxonomy.
- Online/offline branching between local parser execution and backend AI calls.

### B. Out-of-Scope Elements

- Rich tutoring or study-coaching prompts.
- Cloud-only planning tasks such as full allowance forecasting when offline.
- Backend AI contract redesign unless required for compatibility.

## IV. Technical Delivery Requirements

### A. Artifacts & Deliverables to Produce

- `packages/parser/package.json`
- `packages/parser/src/index.ts`
- `packages/parser/src/intent-router.ts`
- `packages/parser/src/intents/*`
- `packages/parser/src/extractors/*`
- `packages/parser/src/schemas/parsed-action.ts`
- `apps/frontend/src/lib/chat/*` - create local execution helpers as needed.
- `apps/frontend/src/actions/chat.ts` - modify to cooperate with local-vs-cloud execution rules.
- `apps/frontend/src/app/(app)/chat/ChatClient.tsx` - modify to handle local confirmations and offline flows.

### B. Core Implementation Constraints

- Parsing logic must live in `packages/parser`, not in React components.
- Local parser outputs must be validated through explicit schemas before execution.
- Offline CRUD intents must write to Dexie and enqueue sync items rather than disappearing into ephemeral chat state.
- AI-dependent intents that cannot be resolved locally must return a friendly offline-safe explanation rather than a crash or silent failure.
- The chat UI must continue to render typed, serializable messages only.
- Local parser execution must preserve the existing friendly confirmation style rather than returning raw JSON to the user.

### C. Supported Intent Expectations

At minimum, the local parser must handle:

- Assignment creation from simple due-date phrasing.
- Expense logging from amount-plus-context phrasing.
- Class creation from simple day/time phrasing.
- Exam creation from simple date/time phrasing.
- Basic deadline queries derived from local assignments and exams.

If confidence is too low for a deterministic local write, the parser must refuse execution and steer the user to retry with clearer wording or reconnect.

## V. Validation & Exit Criteria

A successful implementation must verifiably satisfy:

- Offline students can create at least assignments, expenses, classes, and exams through chat.
- Resulting local writes appear in the corresponding app feature views.
- Each successful offline CRUD intent also generates a sync queue item.
- Unsupported or ambiguous offline requests degrade gracefully into a non-destructive message.
- Online mode still uses the backend AI route for non-local reasoning tasks.
- `pnpm --filter @unilife-ai/frontend build` and `pnpm --filter @unilife-ai/parser build` succeed.

## VI. Required Tests

- Build checks:
  - `pnpm --filter @unilife-ai/frontend build`
  - `pnpm --filter @unilife-ai/parser build`
- Parser unit tests for each supported intent family.
- Regression coverage proving offline CRUD chat actions write to Dexie and enqueue sync items.
- Fallback coverage for ambiguous input and offline AI-only requests.

# Phase 4 Productization Specs

This directory contains the Phase 4 implementation specs for UniLife.AI.

Phase 4 begins after the MVP UI and backend REST foundation are in place. The goal of this phase is to convert the app from a mock-assisted MVP into a reliable student product with real data wiring, offline-first behavior, reminders, and AI-assisted planning that matches the PRD.

## Spec Index

- `P4-S01` - Replace frontend mock data paths with real backend-backed API adapters
- `P4-S02` - Deliver the exams feature end-to-end in the frontend
- `P4-S03` - Implement Dexie-first sync queue flushing and reconnect reconciliation
- `P4-S04` - Build the local parser and offline chat execution flow
- `P4-S05` - Implement local notifications, reminder status, and deep links
- `P4-S06` - Ship daily briefing, free-time planning, and allowance forecast experiences

## Files

- [p4-s01-real-data-integration-and-retire-frontend-mocks.md](./p4-s01-real-data-integration-and-retire-frontend-mocks.md)
- [p4-s02-exams-feature-parity-and-frontend-delivery.md](./p4-s02-exams-feature-parity-and-frontend-delivery.md)
- [p4-s03-dexie-sync-engine-and-reconnect-reconciliation.md](./p4-s03-dexie-sync-engine-and-reconnect-reconciliation.md)
- [p4-s04-local-parser-and-offline-chat-execution.md](./p4-s04-local-parser-and-offline-chat-execution.md)
- [p4-s05-local-notifications-and-reminder-lifecycle.md](./p4-s05-local-notifications-and-reminder-lifecycle.md)
- [p4-s06-daily-briefing-free-time-and-allowance-planning.md](./p4-s06-daily-briefing-free-time-and-allowance-planning.md)

## Global Constraints

**Keep the Phase 3 route architecture.**
The server-entry route pattern, shared shell, root-level Server Actions, and typed `lib/api/*` boundary from `docs/phase3` remain the architectural baseline.

**No mock-backed production flows.**
After `P4-S01`, authenticated app routes must not depend on `src/lib/mock/*` data or `withMockLatency()` for primary behavior.

**Offline-first remains a product requirement, not a future enhancement.**
Any Phase 4 spec that touches CRUD or chat behavior must preserve or improve offline functionality rather than routing around it.

**REST stays the only backend application surface.**
Do not add tRPC procedures, internal Next.js API routes, or alternate RPC layers for domain CRUD.

**Shared contracts stay centralized.**
If a Phase 4 spec changes request or response shapes in a meaningful way, update the corresponding shared types and any relevant core docs in the same workstream.

**PHP remains the only currency displayed to users.**

## Phase 4 Gaps To Close

| Gap ID | Description | Closed by |
| --- | --- | --- |
| `P4-G01` | Frontend feature APIs are still partially mock-backed and not yet aligned with the backend as source of truth | `P4-S01` |
| `P4-G02` | Exams exist in backend/domain types but do not yet have full frontend delivery parity | `P4-S02` |
| `P4-G03` | The sync engine exists only as a contract stub and does not flush queued Dexie operations on reconnect | `P4-S03` |
| `P4-G04` | Offline chat fallback is keyword-only and does not execute local intent parsing plus local writes | `P4-S04` |
| `P4-G05` | Notifications are defined in types and docs but reminders are not scheduled, surfaced, or deep-linkable | `P4-S05` |
| `P4-G06` | Dashboard and chat planning features are still static or incomplete relative to daily briefing, free-time, and allowance goals | `P4-S06` |

# Phase 3 Frontend Refactor Specs

This directory contains the Phase 3 frontend refactor specs for UniLife.AI.

## Spec Index

- `FE-S01` - Establish the authenticated shell and route skeleton
- `FE-S02` - Extract shared types and the mock API boundary
- `FE-S03` - Extract shared UI primitives and feature presentation components
- `FE-S04` - Refactor dashboard and schedule into server-entry routes
- `FE-S05` - Refactor assignments and expenses into server-entry routes
- `FE-S06` - Refactor chat and consolidate auth/onboarding actions

## Files

- [fe-s01-establish-authenticated-shell-and-route-skeleton.md](./fe-s01-establish-authenticated-shell-and-route-skeleton.md)
- [fe-s02-extract-shared-types-and-mock-api-boundary.md](./fe-s02-extract-shared-types-and-mock-api-boundary.md)
- [fe-s03-extract-shared-ui-primitives-and-feature-presentation-components.md](./fe-s03-extract-shared-ui-primitives-and-feature-presentation-components.md)
- [fe-s04-refactor-dashboard-and-schedule-into-server-entry-routes.md](./fe-s04-refactor-dashboard-and-schedule-into-server-entry-routes.md)
- [fe-s05-refactor-assignments-and-expenses-into-server-entry-routes.md](./fe-s05-refactor-assignments-and-expenses-into-server-entry-routes.md)
- [fe-s06-refactor-chat-and-consolidate-auth-onboarding-actions.md](./fe-s06-refactor-chat-and-consolidate-auth-onboarding-actions.md)

## Global Constraints

**No visual changes.**
After all 6 specs are complete, `git diff` on any file that existed before the refactor must show zero Tailwind class changes.

**No new npm dependencies.**
Do not add Zustand, Redux, Jotai, React Query, SWR, or any other library not already present in `package.json`.

**Currency:** PHP (`₱`) throughout all mock data values.

**Icon system:** Material Symbols loaded via Google Fonts CDN. `components/ui/Icon.tsx` is the single source of truth after `FE-S01`. No page or component duplicates this wrapper.

**Server Actions for all mutations.**
No `fetch()` calls to internal Next.js API routes (`/api/*`) for CRUD. Mutations go through `apps/frontend/src/actions/*.ts` Server Actions only.

**Offline resilience.**
`OfflineBanner` reads `navigator.onLine` and the `online`/`offline` window events. API functions in `lib/api/*.ts` must accept an optional offline signal and reject gracefully. Pages must not crash when the mock API rejects.

## Storyboard Gaps

| Gap ID | Story | Gap Description | Must be closed by |
|---|---|---|---|
| `GAP-01` | `S2` | Dashboard AI suggestion card has no online/offline conditional - it always renders | `FE-S04` |
| `GAP-02` | `S4` | Schedule page needs a bottom sheet for class detail - no sheet primitive exists in the codebase | `FE-S03` |
| `GAP-03` | `S8` | Assignment type has no `reminders` field (sent/pending list required by detail screen) | `FE-S02` |
| `GAP-04` | `S9` | Offline state currently has no indicator - pill banner must appear, not a full-screen error | `FE-S01` |
| `GAP-05` | `All` | Empty state (when API returns `[]`) has no shared component - each page handles it differently or not at all | `FE-S03` |

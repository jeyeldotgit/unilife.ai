### FE-S06 - Refactor chat and consolidate auth/onboarding actions

#### I. Meta Specifications
| Field | Value |
|---|---|
| **Spec ID** | FE-S06 |
| **Spec Name** | Refactor chat and consolidate auth/onboarding actions |
| **Responsibility** | Complete the architecture by migrating the last monolithic page, moving onboarding into its final auth route, and centralizing all remaining mutations under root-level Server Actions. |

#### II. System Dependencies & Architectural Context

**Upstream Dependencies** - must be complete before this spec begins:
- `FE-S01` - provides the final shared shell and canonical `(app)` route group.
- `FE-S02` - provides chat, onboarding-starter, and auth-adjacent shared types plus the chat API.
- `FE-S03` - provides `ChatBubble`, `ChatInput`, `QuickActions`, `EmptyState`, and shared icon usage.
- `FE-S04` - provides the server-page/client-companion migration pattern.
- `FE-S05` - provides assignment and expense actions that chat and onboarding may reference conceptually.
- `apps/frontend/src/lib/api/chat.ts` - supplies the typed chat API contract.

**Inputs - Reference Materials** - developer must read before executing:
- `docs/core/STORYBOARD.md § Story 1` - confirm onboarding step order and auth flow requirements.
- `docs/core/STORYBOARD.md § Story 3` - confirm chat-created assignment behavior and confirmation card structure.
- `docs/core/STORYBOARD.md § Story 6` - confirm allowance-related AI response expectations.
- `docs/core/STORYBOARD.md § Story 7` - confirm class-creation via AI intent handling expectations.
- `docs/core/STORYBOARD.md § Story 9` - confirm offline behavior in chat and onboarding-safe shell expectations.
- `docs/core/STORYBOARD.md § Story 10` - confirm quick-action and free-time recommendation message shape.
- `apps/frontend/src/app/(app)/chat/page.tsx` - current monolithic chat implementation to preserve visually.
- `apps/frontend/src/app/(auth)/login/page.tsx` - current clean auth-page composition to preserve.
- `apps/frontend/src/app/(auth)/register/page.tsx` - current clean auth-page composition to preserve.
- `apps/frontend/src/app/(protected)/onboarding/budget/page.tsx` - current onboarding step content to preserve visually.
- `apps/frontend/src/app/(protected)/onboarding/academic-setup/page.tsx` - current onboarding step content to preserve visually.

#### III. Scope Boundaries

**A. In-Scope**

- `apps/frontend/src/app/(app)/chat/page.tsx` - MODIFY - convert into an async server component that fetches initial chat state from `lib/api/chat`.
- `apps/frontend/src/app/(app)/chat/ChatClient.tsx` - CREATE - own chat input state, scrolling, offline fallback, and message submission UI.
- `apps/frontend/src/actions/chat.ts` - CREATE - expose chat message submission as a Server Action.
- `apps/frontend/src/actions/auth.ts` - CREATE - centralize login, register, and logout Server Actions under the root actions directory.
- `apps/frontend/src/actions/onboarding.ts` - CREATE - centralize onboarding mutations under the root actions directory.
- `apps/frontend/src/app/(auth)/onboarding/page.tsx` - CREATE - become the final `/onboarding` route entry.
- `apps/frontend/src/app/(auth)/onboarding/OnboardingClient.tsx` - CREATE - own the multi-step client flow for budget setup then academic setup.
- `apps/frontend/src/app/(auth)/login/page.tsx` - MODIFY - import auth actions from the root actions directory if required by its child form components.
- `apps/frontend/src/app/(auth)/register/page.tsx` - MODIFY - import auth actions from the root actions directory if required by its child form components.
- `apps/frontend/src/app/(auth)/login/actions.ts` - DELETE - remove route-local login action ownership.
- `apps/frontend/src/app/(auth)/register/actions.ts` - DELETE - remove route-local register action ownership.
- `apps/frontend/src/app/(auth)/logout/actions.ts` - DELETE - remove route-local logout action ownership.
- `apps/frontend/src/app/(protected)/onboarding/budget/page.tsx` - DELETE - remove the old protected onboarding step route.
- `apps/frontend/src/app/(protected)/onboarding/academic-setup/page.tsx` - DELETE - remove the old protected onboarding step route.
- `apps/frontend/src/app/(protected)/layout.tsx` - DELETE - remove the obsolete protected route group once onboarding has moved out.

**B. Out-of-Scope**

- Do not implement real AI, Gemini, or natural-language parsing in this spec - chat remains mock-backed.
- Do not redesign the onboarding visuals or merge steps into a different look - preserve the existing step content and styling while changing route architecture only.
- Do not introduce new auth providers or Supabase schema changes - this spec only relocates action ownership and route structure.
- Do not leave any remaining route-local action files under `app/(auth)` or feature folders when the spec is complete.

#### IV. Technical Delivery Requirements

**A. Artifacts & Deliverables**

| File | Responsibility |
|---|---|
| `apps/frontend/src/app/(app)/chat/page.tsx` | Server entry that fetches initial chat state and passes typed props to `ChatClient`. |
| `apps/frontend/src/app/(app)/chat/ChatClient.tsx` | Client companion that owns message input, scroll behavior, offline-aware fallbacks, and action submission. |
| `apps/frontend/src/actions/chat.ts` | Exports chat Server Actions used by `ChatClient`. |
| `apps/frontend/src/actions/auth.ts` | Exports centralized login, register, and logout Server Actions. |
| `apps/frontend/src/actions/onboarding.ts` | Exports onboarding Server Actions used by the multi-step onboarding flow. |
| `apps/frontend/src/app/(auth)/onboarding/page.tsx` | Route entry for `/onboarding` that renders the client-driven onboarding flow. |
| `apps/frontend/src/app/(auth)/onboarding/OnboardingClient.tsx` | Client component that owns step state, form interactions, and action submission for onboarding. |

**B. Core Implementation Constraints**

- **Server Entry Rule:** `chat/page.tsx` must not contain `"use client"` after this spec.
- **Serializable Message Rule:** Chat message state and fixtures must use plain typed data from `lib/types/index.ts`, not embedded JSX.
- **Root Actions Rule:** All remaining mutations for chat, auth, logout, and onboarding must originate from `apps/frontend/src/actions/*.ts`.
- **Single Onboarding Route Rule:** `/onboarding` must be one auth-group route with a client-driven multi-step flow; the old split protected onboarding routes must be removed.
- **Protected Group Removal Rule:** Once onboarding is relocated, no routes may remain under `apps/frontend/src/app/(protected)`.
- **Graceful Offline Rule:** Chat must render a stable offline-safe state when the chat API rejects or `OfflineBanner` indicates no connectivity.

#### V. Validation & Exit Criteria

- [ ] **[Structural]** `apps/frontend/src/app/(app)/chat/ChatClient.tsx` exists and is imported by `chat/page.tsx`.
- [ ] **[Structural]** `apps/frontend/src/app/(auth)/onboarding/page.tsx` and `OnboardingClient.tsx` both exist.
- [ ] **[Boundary]** `apps/frontend/src/actions/auth.ts`, `chat.ts`, and `onboarding.ts` exist and route-local auth action files are deleted.
- [ ] **[Boundary]** No files remain under `apps/frontend/src/app/(protected)` after this spec completes.
- [ ] **[Contract]** Chat messages and quick actions are typed, serializable, and sourced through `lib/api/chat.ts`.
- [ ] **[Visual]** `/chat` preserves the current bubble layout, composer placement, and bottom-nav framing from the pre-refactor page.
- [ ] **[Storyboard gap]** The codebase now satisfies the final route and action architecture needed for Story 1 onboarding and the chat-driven stories without any remaining monolithic page/action exceptions.

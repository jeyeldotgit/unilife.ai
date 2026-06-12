# P5-S01 User Identity Avatar and App Shell Hardening

## I. Meta Specifications

**Spec Name:** P5-S01-user-identity-avatar-and-app-shell-hardening  
**Phase:** Phase 5  
**Responsibility:** Make authenticated identity trustworthy and consistent by using the real user profile everywhere, adding avatar management, and standardizing the authenticated header.

## II. System Dependencies & Architectural Context

**Upstream Dependencies:**
- `P4-S01` real data integration and authenticated API client.
- Phase 3 authenticated shell and shared `PageHeader`.
- Existing Supabase Auth to `public.users` profile synchronization.

**Downstream Dependents:**
- `P5-S02` responsive and failure-state standards.
- `P5-S03`, `P5-S05`, and `P5-S06` timezone-sensitive behavior.

**Inputs (Reference Materials):**
- `packages/database/src/schema/users.ts`
- `packages/types/src/user.ts`
- `apps/frontend/src/app/(app)/layout.tsx`
- `apps/frontend/src/components/layout/AppShell.tsx`
- `apps/frontend/src/components/layout/PageHeader.tsx`
- `apps/frontend/src/actions/auth.ts`

**Resolved Gaps:**
- `public.users.display_name`, not route-local text or Auth metadata, is authoritative on authenticated surfaces.
- Missing profile data must not block authenticated routes.
- Uploaded avatars use a dedicated public Supabase Storage bucket and store their public URL in `public.users.avatar_url`.
- The user timezone is a persisted IANA timezone identifier with device-timezone fallback.

## III. Scope Boundaries

### A. In-Scope Elements

- Authenticated profile read and update contracts.
- Removal of hardcoded authenticated-user names and avatars.
- Shared authenticated header containing greeting, display name, avatar, notification action, and page title.
- Responsive short greeting behavior on narrow screens.
- Avatar menu with Profile and Logout actions.
- Onboarding and profile-settings avatar selection, upload, replace, and remove flows.
- Preset avatars and initials fallback.
- Image validation, crop/compression, and 2 MB upload limit.
- Persisted user timezone and timezone-aware greeting behavior.

### B. Out-of-Scope Elements

- Account deletion and data export.
- Remote avatar moderation services.
- Private-bucket signed URL infrastructure.
- Redesigning the persistent bottom navigation.
- Changing fictional names in clearly marked public marketing examples.

## IV. Technical Delivery Requirements

### A. Artifacts & Deliverables to Produce

- Add `timezone` to the `public.users` schema, migration, shared profile type, and profile adapters.
- Add protected `GET /api/profile` and `PATCH /api/profile` backend contracts.
- Add frontend profile API/action ownership and pass the resolved profile through the authenticated shell.
- Extend the shared header rather than maintaining route-specific identity markup.
- Add an avatar picker to onboarding and profile settings.
- Configure a public Supabase Storage bucket dedicated to avatars with user-scoped write/delete policies.

### B. Profile Contract

The authenticated profile response must expose:

```ts
{
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  timezone: string | null;
  created_at: string;
  updated_at: string;
}
```

`PATCH /api/profile` may update `display_name`, `avatar_url`, and `timezone`. The authenticated user ID is always taken from auth context. The endpoint must reject invalid IANA timezone identifiers and must not accept arbitrary user IDs.

### C. Identity And Header Rules

- Display name resolution is `profile.display_name` followed by the generic label `there`; do not infer names from email.
- Greeting period is calculated in the resolved user timezone.
- A failed or slow profile request renders a stable generic header and retries without blocking page content.
- Every authenticated feature route uses the same header structure. Feature names such as Schedule or Chat appear as page titles, not replacements for identity.
- The avatar falls back to initials only when a display name exists; otherwise use a neutral preset fallback.
- Clicking the avatar opens an accessible menu containing Profile and Logout.
- On narrow screens, shorten or omit the greeting phrase before hiding the page title or actions.

### D. Avatar Rules

- Onboarding offers preset selection, upload, and skip.
- Upload accepts image MIME types only and rejects files larger than 2 MB before upload.
- The client provides crop and compression before upload; the final stored file must remain within the limit.
- Object paths are scoped by authenticated user ID. Storage policies prevent users from writing or deleting another user's avatar.
- Replacing or removing an uploaded avatar deletes the old user-owned object after the profile update succeeds.
- Failed image loads fall back without breaking the menu or header.

## V. Validation & Exit Criteria

- No authenticated route contains a hardcoded user name or uses a route-local identity source.
- Dashboard, schedule, chat, assignments, exams, and expenses render the same authenticated identity/header pattern.
- A missing/null display name renders a generic greeting.
- A saved valid timezone controls greetings and other user-local header dates; absent timezone falls back to the device.
- Avatar presets, valid uploads, skip, replace, and remove all work.
- Invalid formats and files larger than 2 MB are rejected without losing onboarding/profile form state.
- Avatar storage writes and deletes are user-scoped.
- Profile loading failure does not block route content.
- Existing users without timezone or avatar values remain supported.

## VI. Required Tests

- Backend endpoint tests for auth gating, ownership, nullable fields, and timezone validation.
- Storage policy tests proving users cannot overwrite or delete another user's avatar.
- Frontend tests for display-name resolution, generic fallback, timezone greeting boundaries, avatar fallback, and responsive header behavior.
- Upload tests for invalid MIME type, oversized file, compression failure, replacement, and removal.
- Regression search proving authenticated feature routes do not contain hardcoded identity text.
- Build and lint checks for frontend, backend, shared types, and database packages.

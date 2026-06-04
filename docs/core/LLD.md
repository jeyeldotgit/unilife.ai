# Low-Level Design (LLD)

# UniLife.AI

**Version:** 1.0 MVP
**Document Type:** Low-Level Design
**Product:** UniLife.AI â€“ AI-Powered Student Life Companion
**Companion Documents:** HLD v1.0, PRD v1.0 MVP

---

# 1. Introduction

## 1.1 Purpose

This document defines the low-level implementation details of UniLife.AI. It describes file structures, module interfaces, database schemas, API contracts, component designs, data models, and logic flows that developers will directly implement.

This document is the implementation-level reference for all engineers working on the UniLife.AI platform.

---

## 1.2 Scope

This LLD covers the full MVP scope:

- Monorepo scaffold and configuration
- Frontend application (Next.js PWA)
- Backend application (Hono REST API)
- Local AI processing layer (Compromise + Chrono + Zod)
- Offline storage layer (Dexie + IndexedDB)
- Synchronization engine
- Cloud database schema (Supabase PostgreSQL)
- Authentication implementation
- Notification system
- AI fallback integration (Gemini Flash)

---

## 1.3 Conventions

- All file paths are relative to the monorepo root unless otherwise stated.
- TypeScript is used throughout.
- `snake_case` for database columns and sync queue operations.
- `camelCase` for TypeScript variables, functions, and object keys.
- `PascalCase` for TypeScript types, interfaces, and React components.
- `kebab-case` for file names and directory names.

---

# 2. Monorepo Structure

## 2.1 Root Layout

```text
unilife/
â”œâ”€â”€ apps/
â”‚   â”œâ”€â”€ frontend/
â”‚   â””â”€â”€ backend/
â”œâ”€â”€ packages/
â”‚   â”œâ”€â”€ database-types/
â”‚   â”œâ”€â”€ parser/
â”‚   â”œâ”€â”€ ai-core/
â”‚   â””â”€â”€ shared/
â”œâ”€â”€ turbo.json
â”œâ”€â”€ pnpm-workspace.yaml
â”œâ”€â”€ tsconfig.base.json
â””â”€â”€ package.json
```

---

## 2.2 pnpm-workspace.yaml

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

---

## 2.3 turbo.json

```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {},
    "type-check": {
      "dependsOn": ["^build"]
    }
  }
}
```

---

## 2.4 tsconfig.base.json

```json
{
  "compilerOptions": {
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "bundler",
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ESNext"
  }
}
```

---

# 3. packages/database-types

## 3.1 Purpose

Shared TypeScript types for all database entities. Used by both frontend (Dexie schema) and backend (REST handlers, Supabase queries).

---

## 3.2 File Structure

```text
packages/database-types/
â”œâ”€â”€ src/
â”‚   â”œâ”€â”€ index.ts
â”‚   â”œâ”€â”€ user.ts
â”‚   â”œâ”€â”€ class.ts
â”‚   â”œâ”€â”€ assignment.ts
â”‚   â”œâ”€â”€ exam.ts
â”‚   â”œâ”€â”€ expense.ts
â”‚   â”œâ”€â”€ budget.ts
â”‚   â”œâ”€â”€ notification.ts
â”‚   â”œâ”€â”€ sync-queue.ts
â”‚   â””â”€â”€ ai-log.ts
â”œâ”€â”€ package.json
â””â”€â”€ tsconfig.json
```

---

## 3.3 Type Definitions

### user.ts

```typescript
export type User = {
  id: string; // UUID
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string; // ISO 8601
  updated_at: string;
};
```

---

### class.ts

```typescript
export type DayOfWeek =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export type ClassRecord = {
  id: string; // UUID (client-generated)
  user_id: string;
  subject: string;
  room: string | null;
  instructor: string | null;
  day_of_week: DayOfWeek;
  start_time: string; // "HH:MM" 24-hour format
  end_time: string; // "HH:MM" 24-hour format
  color: string | null; // hex color for UI
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null; // soft delete
};
```

---

### assignment.ts

```typescript
export type AssignmentStatus = "pending" | "in_progress" | "completed";

export type Assignment = {
  id: string;
  user_id: string;
  class_id: string | null; // optional link to a class
  title: string;
  description: string | null;
  due_date: string; // ISO 8601
  status: AssignmentStatus;
  priority: number; // 1 (low) to 3 (high)
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};
```

---

### exam.ts

```typescript
export type Exam = {
  id: string;
  user_id: string;
  class_id: string | null;
  title: string;
  description: string | null;
  exam_date: string; // ISO 8601
  location: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};
```

---

### expense.ts

```typescript
export type ExpenseCategory =
  | "food"
  | "transportation"
  | "school"
  | "entertainment"
  | "miscellaneous";

export type Expense = {
  id: string;
  user_id: string;
  budget_id: string | null;
  amount: number; // in PHP, stored as float
  category: ExpenseCategory;
  description: string | null;
  spent_at: string; // ISO 8601
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};
```

---

### budget.ts

```typescript
export type BudgetPeriod = "weekly" | "biweekly" | "monthly";

export type Budget = {
  id: string;
  user_id: string;
  amount: number; // total allowance
  period: BudgetPeriod;
  start_date: string; // ISO 8601 date
  end_date: string; // ISO 8601 date
  created_at: string;
  updated_at: string;
};
```

---

### notification.ts

```typescript
export type NotificationEntityType = "class" | "assignment" | "exam";

export type NotificationStatus = "pending" | "sent" | "dismissed";

export type Notification = {
  id: string;
  user_id: string;
  entity_type: NotificationEntityType;
  entity_id: string;
  title: string;
  body: string;
  scheduled_at: string; // ISO 8601
  status: NotificationStatus;
  created_at: string;
};
```

---

### sync-queue.ts

```typescript
export type SyncOperation = "create" | "update" | "delete";

export type SyncEntityType =
  | "class"
  | "assignment"
  | "exam"
  | "expense"
  | "budget";

export type SyncStatus = "pending" | "syncing" | "synced" | "failed";

export type SyncQueueItem = {
  id: string; // local UUID
  user_id: string;
  entity_type: SyncEntityType;
  entity_id: string;
  operation: SyncOperation;
  payload: Record<string, unknown>;
  status: SyncStatus;
  retry_count: number;
  created_at: string;
  last_attempted_at: string | null;
};
```

---

### ai-log.ts

```typescript
export type AIProcessingLayer = "local" | "gemini";

export type AILog = {
  id: string;
  user_id: string;
  raw_input: string;
  detected_intent: string | null;
  confidence: number | null; // 0.0 to 1.0
  processing_layer: AIProcessingLayer;
  structured_output: Record<string, unknown> | null;
  error: string | null;
  created_at: string;
};
```

---

# 4. Database Schema (Supabase PostgreSQL)

## 4.1 Schema Conventions

- All primary keys are `UUID` generated client-side with `crypto.randomUUID()`.
- All timestamps are `TIMESTAMPTZ` stored in UTC.
- Soft deletes use a `deleted_at` nullable column.
- Row Level Security (RLS) is enabled on all tables.
- All RLS policies restrict access to `auth.uid() = user_id`.

---

## 4.2 Migration: 001_create_users_profile.sql

```sql
CREATE TABLE public.users (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email        TEXT NOT NULL,
  display_name TEXT,
  avatar_url   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);
```

---

## 4.3 Migration: 002_create_classes.sql

```sql
CREATE TABLE public.classes (
  id          UUID PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  subject     TEXT NOT NULL,
  room        TEXT,
  instructor  TEXT,
  day_of_week TEXT NOT NULL CHECK (
    day_of_week IN (
      'monday','tuesday','wednesday',
      'thursday','friday','saturday','sunday'
    )
  ),
  start_time  TIME NOT NULL,
  end_time    TIME NOT NULL,
  color       TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ
);

ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own classes"
  ON public.classes FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX idx_classes_user_id ON public.classes(user_id);
CREATE INDEX idx_classes_day ON public.classes(day_of_week);
```

---

## 4.4 Migration: 003_create_assignments.sql

```sql
CREATE TABLE public.assignments (
  id          UUID PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  class_id    UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  title       TEXT NOT NULL,
  description TEXT,
  due_date    TIMESTAMPTZ NOT NULL,
  status      TEXT NOT NULL DEFAULT 'pending'
              CHECK (status IN ('pending','in_progress','completed')),
  priority    SMALLINT NOT NULL DEFAULT 1 CHECK (priority BETWEEN 1 AND 3),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ
);

ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own assignments"
  ON public.assignments FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX idx_assignments_user_id ON public.assignments(user_id);
CREATE INDEX idx_assignments_due_date ON public.assignments(due_date);
CREATE INDEX idx_assignments_status ON public.assignments(status);
```

---

## 4.5 Migration: 004_create_exams.sql

```sql
CREATE TABLE public.exams (
  id          UUID PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  class_id    UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  title       TEXT NOT NULL,
  description TEXT,
  exam_date   TIMESTAMPTZ NOT NULL,
  location    TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ
);

ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own exams"
  ON public.exams FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX idx_exams_user_id ON public.exams(user_id);
CREATE INDEX idx_exams_exam_date ON public.exams(exam_date);
```

---

## 4.6 Migration: 005_create_expenses.sql

```sql
CREATE TABLE public.expenses (
  id          UUID PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  budget_id   UUID,
  amount      NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  category    TEXT NOT NULL CHECK (
    category IN (
      'food','transportation','school',
      'entertainment','miscellaneous'
    )
  ),
  description TEXT,
  spent_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own expenses"
  ON public.expenses FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX idx_expenses_user_id ON public.expenses(user_id);
CREATE INDEX idx_expenses_spent_at ON public.expenses(spent_at);
CREATE INDEX idx_expenses_category ON public.expenses(category);
```

---

## 4.7 Migration: 006_create_budgets.sql

```sql
CREATE TABLE public.budgets (
  id          UUID PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount      NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  period      TEXT NOT NULL CHECK (period IN ('weekly','biweekly','monthly')),
  start_date  DATE NOT NULL,
  end_date    DATE NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT budgets_date_check CHECK (end_date > start_date)
);

ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own budgets"
  ON public.budgets FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX idx_budgets_user_id ON public.budgets(user_id);
```

---

## 4.8 Migration: 007_create_notifications.sql

```sql
CREATE TABLE public.notifications (
  id           UUID PRIMARY KEY,
  user_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  entity_type  TEXT NOT NULL CHECK (entity_type IN ('class','assignment','exam')),
  entity_id    UUID NOT NULL,
  title        TEXT NOT NULL,
  body         TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  status       TEXT NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending','sent','dismissed')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own notifications"
  ON public.notifications FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_scheduled_at ON public.notifications(scheduled_at);
CREATE INDEX idx_notifications_status ON public.notifications(status);
```

---

## 4.9 Migration: 008_create_sync_queue.sql

```sql
CREATE TABLE public.sync_queue (
  id                UUID PRIMARY KEY,
  user_id           UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  entity_type       TEXT NOT NULL,
  entity_id         UUID NOT NULL,
  operation         TEXT NOT NULL CHECK (operation IN ('create','update','delete')),
  payload           JSONB NOT NULL,
  status            TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','syncing','synced','failed')),
  retry_count       SMALLINT NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_attempted_at TIMESTAMPTZ
);

ALTER TABLE public.sync_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own sync queue"
  ON public.sync_queue FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX idx_sync_queue_user_status ON public.sync_queue(user_id, status);
```

---

## 4.10 Migration: 009_create_ai_logs.sql

```sql
CREATE TABLE public.ai_logs (
  id                UUID PRIMARY KEY,
  user_id           UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  raw_input         TEXT NOT NULL,
  detected_intent   TEXT,
  confidence        NUMERIC(4,3),
  processing_layer  TEXT NOT NULL CHECK (processing_layer IN ('local','gemini')),
  structured_output JSONB,
  error             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.ai_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own ai logs"
  ON public.ai_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE INDEX idx_ai_logs_user_id ON public.ai_logs(user_id);
```

---

## 4.11 Database Trigger: Auto-update updated_at

```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_classes_updated_at
  BEFORE UPDATE ON public.classes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_assignments_updated_at
  BEFORE UPDATE ON public.assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_exams_updated_at
  BEFORE UPDATE ON public.exams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_budgets_updated_at
  BEFORE UPDATE ON public.budgets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

---

# 5. packages/shared

## 5.1 Purpose

Shared utility functions used across frontend, backend, and other packages.

---

## 5.2 File Structure

```text
packages/shared/
â”œâ”€â”€ src/
â”‚   â”œâ”€â”€ index.ts
â”‚   â”œâ”€â”€ uuid.ts
â”‚   â”œâ”€â”€ date.ts
â”‚   â””â”€â”€ constants.ts
â”œâ”€â”€ package.json
â””â”€â”€ tsconfig.json
```

---

## 5.3 uuid.ts

```typescript
export function generateId(): string {
  return crypto.randomUUID();
}
```

---

## 5.4 date.ts

```typescript
export function toISOString(date: Date): string {
  return date.toISOString();
}

export function nowISO(): string {
  return new Date().toISOString();
}

export function daysUntil(isoDate: string): number {
  const now = new Date();
  const target = new Date(isoDate);
  const diff = target.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}
```

---

## 5.5 constants.ts

```typescript
export const SYNC_RETRY_LIMIT = 3;

export const AI_CONFIDENCE_THRESHOLD = 0.7;

export const NOTIFICATION_OFFSETS = {
  class: [30], // minutes before
  assignment: [7 * 1440, 3 * 1440, 1440, 180], // minutes before
  exam: [14 * 1440, 7 * 1440, 3 * 1440, 1440], // minutes before
} as const;

export const EXPENSE_CATEGORIES = [
  "food",
  "transportation",
  "school",
  "entertainment",
  "miscellaneous",
] as const;
```

---

# 6. Frontend Application (apps/frontend)

## 6.1 File Structure

```text
apps/frontend/
â”œâ”€â”€ app/
â”‚   â”œâ”€â”€ (auth)/
â”‚   â”‚   â”œâ”€â”€ login/
â”‚   â”‚   â”‚   â””â”€â”€ page.tsx
â”‚   â”‚   â””â”€â”€ register/
â”‚   â”‚       â””â”€â”€ page.tsx
â”‚   â”œâ”€â”€ (app)/
â”‚   â”‚   â”œâ”€â”€ layout.tsx
â”‚   â”‚   â”œâ”€â”€ dashboard/
â”‚   â”‚   â”‚   â””â”€â”€ page.tsx
â”‚   â”‚   â”œâ”€â”€ schedule/
â”‚   â”‚   â”‚   â””â”€â”€ page.tsx
â”‚   â”‚   â”œâ”€â”€ assignments/
â”‚   â”‚   â”‚   â””â”€â”€ page.tsx
â”‚   â”‚   â”œâ”€â”€ exams/
â”‚   â”‚   â”‚   â””â”€â”€ page.tsx
â”‚   â”‚   â”œâ”€â”€ expenses/
â”‚   â”‚   â”‚   â””â”€â”€ page.tsx
â”‚   â”‚   â””â”€â”€ chat/
â”‚   â”‚       â””â”€â”€ page.tsx
â”‚   â”œâ”€â”€ layout.tsx
â”‚   â””â”€â”€ page.tsx
â”œâ”€â”€ components/
â”‚   â”œâ”€â”€ ui/                      # shadcn components
â”‚   â”œâ”€â”€ layout/
â”‚   â”‚   â”œâ”€â”€ sidebar.tsx
â”‚   â”‚   â”œâ”€â”€ bottom-nav.tsx
â”‚   â”‚   â””â”€â”€ header.tsx
â”‚   â”œâ”€â”€ schedule/
â”‚   â”‚   â”œâ”€â”€ weekly-view.tsx
â”‚   â”‚   â””â”€â”€ class-card.tsx
â”‚   â”œâ”€â”€ assignments/
â”‚   â”‚   â”œâ”€â”€ assignment-list.tsx
â”‚   â”‚   â””â”€â”€ assignment-card.tsx
â”‚   â”œâ”€â”€ expenses/
â”‚   â”‚   â”œâ”€â”€ expense-list.tsx
â”‚   â”‚   â””â”€â”€ budget-summary.tsx
â”‚   â””â”€â”€ chat/
â”‚       â”œâ”€â”€ chat-input.tsx
â”‚       â””â”€â”€ chat-bubble.tsx
â”œâ”€â”€ lib/
â”‚   â”œâ”€â”€ supabase/
â”‚   â”‚   â”œâ”€â”€ client.ts
â”‚   â”‚   â””â”€â”€ server.ts
â”‚   â”œâ”€â”€ db/
â”‚   â”‚   â””â”€â”€ dexie.ts
â”‚   â”œâ”€â”€ sync/
â”‚   â”‚   â””â”€â”€ sync-engine.ts
â”‚   â””â”€â”€ utils.ts
â”œâ”€â”€ hooks/
â”‚   â”œâ”€â”€ use-auth.ts
â”‚   â”œâ”€â”€ use-sync.ts
â”‚   â”œâ”€â”€ use-classes.ts
â”‚   â”œâ”€â”€ use-assignments.ts
â”‚   â”œâ”€â”€ use-exams.ts
â”‚   â””â”€â”€ use-expenses.ts
â”œâ”€â”€ middleware.ts
â”œâ”€â”€ next.config.ts
â”œâ”€â”€ tailwind.config.ts
â””â”€â”€ tsconfig.json
```

---

## 6.2 Supabase Client

### lib/supabase/client.ts

```typescript
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
```

### lib/supabase/server.ts

```typescript
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        },
      },
    },
  );
}
```

---

## 6.3 Middleware

### middleware.ts

```typescript
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthRoute =
    request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/register");

  if (!user && !isAuthRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

---

## 6.4 Authentication Pages

### app/(auth)/login/page.tsx â€” Logic Contract

Inputs:

- `email: string`
- `password: string`

Actions:

- Call `supabase.auth.signInWithPassword({ email, password })`
- On success: redirect to `/dashboard`
- On error: display error message inline

Validations:

- Email must be non-empty and valid format
- Password must be non-empty

---

### app/(auth)/register/page.tsx â€” Logic Contract

Inputs:

- `email: string`
- `password: string`
- `display_name: string`

Actions:

- Call `supabase.auth.signUp({ email, password })`
- On success: insert row into `public.users` with `display_name`
- Redirect to `/dashboard`
- On error: display error message inline

Validations:

- Email must be valid format
- Password must be minimum 8 characters
- Display name must be non-empty

---

## 6.5 Dexie Schema

### lib/db/dexie.ts

```typescript
import Dexie, { type Table } from "dexie";
import type {
  ClassRecord,
  Assignment,
  Exam,
  Expense,
  Budget,
  Notification,
  SyncQueueItem,
} from "@unilife/database-types";

export class UniLifeDB extends Dexie {
  classes!: Table<ClassRecord, string>;
  assignments!: Table<Assignment, string>;
  exams!: Table<Exam, string>;
  expenses!: Table<Expense, string>;
  budgets!: Table<Budget, string>;
  notifications!: Table<Notification, string>;
  sync_queue!: Table<SyncQueueItem, string>;

  constructor() {
    super("unilife");

    this.version(1).stores({
      classes: "id, user_id, day_of_week, is_active, deleted_at",
      assignments: "id, user_id, class_id, due_date, status, deleted_at",
      exams: "id, user_id, class_id, exam_date, deleted_at",
      expenses: "id, user_id, budget_id, category, spent_at, deleted_at",
      budgets: "id, user_id, start_date, end_date",
      notifications:
        "id, user_id, entity_type, entity_id, scheduled_at, status",
      sync_queue: "id, user_id, entity_type, entity_id, status, created_at",
    });
  }
}

export const db = new UniLifeDB();
```

---

## 6.6 Client Data Hooks

Authentication is **not** exposed through a dedicated `useAuth` hook.

Auth is handled server-first:

- Route protection happens in middleware and protected layouts using the server Supabase client
- Login and logout are implemented as Next.js server actions
- Client components receive authenticated state from their server-rendered parent or via explicit props

A client auth subscription such as `supabase.auth.onAuthStateChange()` is not required for the MVP because the current flow already redirects and refreshes correctly on the server.

The hooks in this section are reserved for the offline-first data layer. They are useful only for entities whose source of truth in the browser is Dexie plus the sync queue.

---

### hooks/use-classes.ts â€” Interface

```typescript
type UseClassesReturn = {
  classes: ClassRecord[];
  loading: boolean;
  createClass: (input: CreateClassInput) => Promise<void>;
  updateClass: (id: string, input: Partial<ClassRecord>) => Promise<void>;
  deleteClass: (id: string) => Promise<void>;
};

type CreateClassInput = {
  subject: string;
  day_of_week: DayOfWeek;
  start_time: string;
  end_time: string;
  room?: string;
  instructor?: string;
  color?: string;
};
```

Behavior:

- Reads from Dexie `classes` table, filtered by current `user_id` and `deleted_at IS NULL`
- All writes go to Dexie first, then enqueue a sync operation
- Deletes are soft deletes: set `deleted_at = nowISO()`

---

### hooks/use-assignments.ts â€” Interface

```typescript
type UseAssignmentsReturn = {
  assignments: Assignment[];
  loading: boolean;
  createAssignment: (input: CreateAssignmentInput) => Promise<void>;
  updateAssignment: (id: string, input: Partial<Assignment>) => Promise<void>;
  deleteAssignment: (id: string) => Promise<void>;
  markComplete: (id: string) => Promise<void>;
};

type CreateAssignmentInput = {
  title: string;
  due_date: string;
  class_id?: string;
  description?: string;
  priority?: number;
};
```

Behavior:

- Reads from Dexie `assignments` table, filtered by current `user_id` and `deleted_at IS NULL`
- All writes go to Dexie first, then enqueue a sync operation
- `markComplete` updates `status = "completed"` and enqueues an update operation

---

### hooks/use-expenses.ts â€” Interface

```typescript
type UseExpensesReturn = {
  expenses: Expense[];
  budget: Budget | null;
  remaining: number;
  loading: boolean;
  logExpense: (input: LogExpenseInput) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
};

type LogExpenseInput = {
  amount: number;
  category: ExpenseCategory;
  description?: string;
  spent_at?: string;
};
```

Behavior:

- `remaining` is computed as `budget.amount - sum(expenses.amount)` for the active budget period
- Expense and budget reads come from Dexie and stay usable while offline
- Writes enqueue sync work after the local transaction succeeds

Implementation note:

- If the product later drops offline-first behavior for a feature, replace these hooks with server actions or server component data loading instead of adding client-side cache layers by default

---

## 6.7 Sync Engine

### lib/sync/sync-engine.ts

```typescript
type SyncEngine = {
  start: () => void; // begin listening to connectivity
  stop: () => void; // stop listeners
  flush: () => Promise<void>; // manually trigger sync
};
```

Internal behavior:

```text
start()
  â†’ listen to window.addEventListener("online")
  â†’ on online event: call flush()

flush()
  â†’ query db.sync_queue where status = "pending"
  â†’ for each item (ordered by created_at ASC):
      â†’ set status = "syncing"
      â†’ POST to /api/sync/push with item payload
      â†’ on success: set status = "synced"
      â†’ on failure:
          â†’ increment retry_count
          â†’ if retry_count >= SYNC_RETRY_LIMIT: set status = "failed"
          â†’ else: set status = "pending"
```

Conflict resolution strategy: **last-write-wins** using `updated_at`. The backend compares the payload's `updated_at` against the existing record's `updated_at` and accepts whichever is newer.

---

# 7. Backend Application (apps/backend)

## 7.1 File Structure

```text
apps/backend/
├── src/
│   ├── index.ts
│   ├── app.ts
│   ├── router.ts
│   ├── middleware/
│   │   └── auth.ts
│   ├── lib/
│   │   ├── http-errors.ts
│   │   ├── validation.ts
│   │   └── supabase.ts
│   ├── routes/
│   │   ├── health.route.ts
│   │   ├── sync.route.ts
│   │   ├── classes.route.ts
│   │   ├── assignments.route.ts
│   │   ├── exams.route.ts
│   │   ├── expenses.route.ts
│   │   ├── budgets.route.ts
│   │   └── ai.route.ts
│   ├── controllers/
│   ├── services/
│   └── repositories/
├── package.json
└── tsconfig.json
```

The backend is a Hono REST API. Do not add alternate RPC routers or non-REST API mounts.

---

## 7.2 Entry Point

### src/index.ts

```typescript
import { serve } from "@hono/node-server";
import { app } from "./app";

const port = Number(process.env.PORT ?? 3001);

serve({ fetch: app.fetch, port });
```

### src/app.ts

```typescript
import { Hono } from "hono";
import { cors } from "hono/cors";
import { registerRoutes } from "./router";
import { handleHttpError } from "./lib/http-errors";

export const app = new Hono();

app.use(
  "/*",
  cors({
    origin: process.env.FRONTEND_URL ?? "*",
    credentials: true,
  }),
);

app.onError(handleHttpError);

registerRoutes(app);
```

---

## 7.3 Auth Context and Middleware

### src/middleware/auth.ts

```typescript
import type { Context, Next } from "hono";
import { createSupabaseClient } from "../lib/supabase";
import { unauthenticated } from "../lib/http-errors";

export async function requireAuth(c: Context, next: Next) {
  const authHeader = c.req.header("Authorization");
  const token = authHeader?.replace(/^Bearer\s+/i, "");

  if (!token) {
    throw unauthenticated("Missing bearer token.");
  }

  const supabase = createSupabaseClient();
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user?.id) {
    throw unauthenticated("Invalid or expired bearer token.");
  }

  c.set("userId", data.user.id);
  c.set("supabase", supabase);

  await next();
}
```

Protected handlers read `c.get("userId")`. Client-provided `user_id` is never authoritative.

---

## 7.4 Root Route Registration

### src/router.ts

```typescript
import type { Hono } from "hono";
import { healthRoute } from "./routes/health.route";
import { syncRoute } from "./routes/sync.route";
import { classesRoute } from "./routes/classes.route";
import { assignmentsRoute } from "./routes/assignments.route";
import { examsRoute } from "./routes/exams.route";
import { expensesRoute } from "./routes/expenses.route";
import { budgetsRoute } from "./routes/budgets.route";
import { aiRoute } from "./routes/ai.route";

export function registerRoutes(app: Hono) {
  app.route("/", healthRoute);
  app.route("/api/sync", syncRoute);
  app.route("/api/classes", classesRoute);
  app.route("/api/assignments", assignmentsRoute);
  app.route("/api/exams", examsRoute);
  app.route("/api/expenses", expensesRoute);
  app.route("/api/budgets", budgetsRoute);
  app.route("/api/ai", aiRoute);
}
```

---

## 7.5 Sync Route

### src/routes/sync.route.ts

Endpoint: `POST /api/sync/push`

Input:

```typescript
z.object({
  items: z.array(
    z.object({
      id: z.string().uuid(),
      entity_type: z.enum(["class", "assignment", "exam", "expense", "budget"]),
      entity_id: z.string().uuid(),
      operation: z.enum(["create", "update", "delete"]),
      payload: z.record(z.unknown()),
    }),
  ),
});
```

Logic:

```text
for each item:
  switch entity_type:
    case "class":
      switch operation:
        case "create" -> upsert into classes
        case "update" -> update if payload.updated_at is newer than stored updated_at
        case "delete" -> set deleted_at = now
    ... repeat for supported entity types
```

Returns: `{ synced: string[], failed: string[] }`.

---

## 7.6 CRUD Routes - Interface Contract

Each entity route group exposes REST endpoints matching `docs/core/ENDPOINT_REF.md`:

| Endpoint | Description |
| -------- | ----------- |
| `GET /api/:entity?since=...` | List non-deleted records; `since` filters by `updated_at` for delta sync |
| `GET /api/:entity/:id` | Get single record |
| `POST /api/:entity` | Create record; server injects authenticated `user_id` |
| `PATCH /api/:entity/:id` | Update record with last-write-wins |
| `DELETE /api/:entity/:id` | Soft delete where supported |

All protected route groups use `requireAuth` and scope queries to the authenticated `userId`.

---

## 7.7 AI Route

### src/routes/ai.route.ts

Endpoint: `POST /api/ai/chat`

Input:

```typescript
z.object({
  message: z.string().min(1).max(1000),
  context: z.object({
    today: z.string(),
    current_time: z.string(),
    todays_classes: z.array(
      z.object({
        subject: z.string(),
        start_time: z.string(),
        end_time: z.string(),
      }),
    ),
    upcoming_deadlines: z.array(
      z.object({
        title: z.string(),
        due_date: z.string(),
        type: z.enum(["assignment", "exam"]),
        status: z.enum(["pending", "in_progress"]),
      }),
    ),
    budget_remaining: z.number().nullable(),
    budget_period_end_date: z.string().nullable(),
    avg_daily_spend: z.number().nullable(),
  }),
});
```

Logic:

```text
1. Call Gemini Flash with system prompt + user message + frontend-provided context
2. Parse structured JSON response
3. Validate parsed response with Zod
4. Log to ai_logs table
5. Return structured action or text response
```

The AI route does not write academic or finance records. The frontend writes confirmed actions to Dexie and later persists them through `POST /api/sync/push`.

---
# 8. packages/parser

## 8.1 Purpose

Local NLP processing layer. Operates fully offline. Handles simple, structured natural language commands in both English and Filipino.

---

## 8.2 File Structure

```text
packages/parser/
â”œâ”€â”€ src/
â”‚   â”œâ”€â”€ index.ts
â”‚   â”œâ”€â”€ intent-router.ts
â”‚   â”œâ”€â”€ extractors/
â”‚   â”‚   â”œâ”€â”€ date-extractor.ts
â”‚   â”‚   â”œâ”€â”€ time-extractor.ts
â”‚   â”‚   â”œâ”€â”€ amount-extractor.ts
â”‚   â”‚   â””â”€â”€ category-extractor.ts
â”‚   â”œâ”€â”€ intents/
â”‚   â”‚   â”œâ”€â”€ create-assignment.ts
â”‚   â”‚   â”œâ”€â”€ create-class.ts
â”‚   â”‚   â”œâ”€â”€ create-exam.ts
â”‚   â”‚   â”œâ”€â”€ log-expense.ts
â”‚   â”‚   â””â”€â”€ query-deadlines.ts
â”‚   â””â”€â”€ schemas/
â”‚       â””â”€â”€ parsed-action.ts
â”œâ”€â”€ package.json
â””â”€â”€ tsconfig.json
```

---

## 8.3 ParsedAction Schema

### src/schemas/parsed-action.ts

```typescript
import { z } from "zod";

export const ParsedActionSchema = z.discriminatedUnion("intent", [
  z.object({
    intent: z.literal("create_assignment"),
    confidence: z.number(),
    data: z.object({
      title: z.string(),
      due_date: z.string(), // ISO 8601
    }),
  }),
  z.object({
    intent: z.literal("create_class"),
    confidence: z.number(),
    data: z.object({
      subject: z.string(),
      day_of_week: z.string(),
      start_time: z.string(),
    }),
  }),
  z.object({
    intent: z.literal("create_exam"),
    confidence: z.number(),
    data: z.object({
      subject: z.string(),
      exam_date: z.string(),
    }),
  }),
  z.object({
    intent: z.literal("log_expense"),
    confidence: z.number(),
    data: z.object({
      amount: z.number(),
      category: z.string().optional(),
    }),
  }),
  z.object({
    intent: z.literal("query_deadlines"),
    confidence: z.number(),
    data: z.object({
      range: z.enum(["today", "this_week", "next_week"]),
    }),
  }),
  z.object({
    intent: z.literal("unknown"),
    confidence: z.number(),
    data: z.object({}),
  }),
]);

export type ParsedAction = z.infer<typeof ParsedActionSchema>;
```

---

## 8.4 Intent Router

### src/intent-router.ts

```typescript
export function routeIntent(input: string): ParsedAction {
  const normalized = input.trim().toLowerCase();

  // Try each intent handler in priority order
  const handlers = [
    tryCreateAssignment,
    tryCreateClass,
    tryCreateExam,
    tryLogExpense,
    tryQueryDeadlines,
  ];

  for (const handler of handlers) {
    const result = handler(normalized);
    if (result && result.confidence >= AI_CONFIDENCE_THRESHOLD) {
      return result;
    }
  }

  return { intent: "unknown", confidence: 0, data: {} };
}
```

---

## 8.5 Intent: create_assignment

Trigger keywords: `assignment`, `submit`, `pass`, `deadline`, `ipasa`, `gawa`

Logic:

```text
1. Detect keyword match
2. Extract date using chrono-node.parseDate(input)
3. Extract time if present
4. Extract title as remaining text after removing date/time tokens
5. Set confidence = 0.85 if date found, 0.5 if not
```

Example inputs and expected outputs:

```text
Input:  "assignment tomorrow 9pm"
Output: { intent: "create_assignment", confidence: 0.85,
          data: { title: "assignment", due_date: "2026-06-03T21:00:00Z" } }

Input:  "submit math hw tuesday"
Output: { intent: "create_assignment", confidence: 0.85,
          data: { title: "math hw", due_date: "2026-06-09T00:00:00Z" } }
```

---

## 8.6 Intent: log_expense

Trigger keywords: numeric amount detected in input; keywords `gastos`, `nagastos`, `spent`, `lunch`, `fare`, `bayad`

Logic:

```text
1. Use regex /\d+(\.\d{1,2})?/ to extract amount
2. Match category keywords against EXPENSE_CATEGORIES
3. Set confidence = 0.9 if amount found, 0.4 if not
```

Example inputs:

```text
Input:  "lunch 120"
Output: { intent: "log_expense", confidence: 0.9,
          data: { amount: 120, category: "food" } }

Input:  "fare 35"
Output: { intent: "log_expense", confidence: 0.9,
          data: { amount: 35, category: "transportation" } }

Input:  "nagastos ako ng 250 sa school supplies"
Output: { intent: "log_expense", confidence: 0.9,
          data: { amount: 250, category: "school" } }
```

---

# 9. packages/ai-core

## 9.1 Purpose

Wrapper around Gemini Flash API. Used by the backend AI router. Handles prompt construction, response parsing, and error handling.

---

## 9.2 File Structure

```text
packages/ai-core/
â”œâ”€â”€ src/
â”‚   â”œâ”€â”€ index.ts
â”‚   â”œâ”€â”€ gemini-client.ts
â”‚   â”œâ”€â”€ prompts/
â”‚   â”‚   â”œâ”€â”€ system-prompt.ts
â”‚   â”‚   â””â”€â”€ daily-briefing-prompt.ts
â”‚   â””â”€â”€ parsers/
â”‚       â””â”€â”€ response-parser.ts
â”œâ”€â”€ package.json
â””â”€â”€ tsconfig.json
```

---

## 9.3 Gemini Client

### src/gemini-client.ts

```typescript
type GeminiRequest = {
  message: string;
  systemPrompt: string;
  context?: Record<string, unknown>;
};

type GeminiResponse = {
  text: string;
  raw: unknown;
};

export async function callGemini(req: GeminiRequest): Promise<GeminiResponse>;
```

Implementation:

- Uses `@google/generative-ai` SDK
- Model: `gemini-1.5-flash`
- Temperature: `0.2` for structured outputs, `0.7` for conversational
- Max tokens: `1024`

---

## 9.4 System Prompt

```text
You are UniLife, an AI companion for Filipino university students.

Your role is to help students manage their classes, assignments, exams, and finances.

When the user sends a message, respond with a JSON object only. No markdown, no explanation.

Response format:
{
  "intent": "<detected intent>",
  "action": { <structured data if applicable> } | null,
  "message": "<friendly response in Filipino or English matching user's language>"
}

Supported intents:
- create_assignment
- create_class
- create_exam
- log_expense
- query_schedule
- query_deadlines
- query_budget
- general_question
- unknown
```

---

# 10. Notification System

## 10.1 Local Notifications (Frontend)

Technology: `Notification API` + `ServiceWorker`

Logic:

```text
On entity create/update:
  â†’ compute notification schedule based on NOTIFICATION_OFFSETS
  â†’ store notifications in Dexie notifications table
  â†’ register setTimeout or ServiceWorker scheduled message
    for each notification time
```

Permission check:

```typescript
async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) return false;
  const permission = await Notification.requestPermission();
  return permission === "granted";
}
```

---

## 10.2 Notification Schedule Logic

```typescript
function computeNotificationSchedule(
  entityType: NotificationEntityType,
  scheduledDate: Date,
): Date[] {
  const offsets = NOTIFICATION_OFFSETS[entityType]; // minutes
  return offsets.map((offset) => {
    const time = new Date(scheduledDate.getTime());
    time.setMinutes(time.getMinutes() - offset);
    return time;
  });
}
```

---

# 11. Environment Variables

## 11.1 Frontend (.env.local)

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_BACKEND_URL=
```

---

## 11.2 Backend (.env)

```text
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=
FRONTEND_URL=
PORT=3001
```

---

# 12. Deployment Configuration

## 12.1 Vercel (Frontend)

```json
{
  "buildCommand": "pnpm turbo build --filter=frontend",
  "outputDirectory": "apps/frontend/.next",
  "installCommand": "pnpm install",
  "framework": "nextjs"
}
```

Environment variables to set in Vercel dashboard:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_BACKEND_URL`

---

## 12.2 Railway (Backend)

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm install -g pnpm
RUN pnpm install
RUN pnpm turbo build --filter=backend
EXPOSE 3001
CMD ["node", "apps/backend/dist/index.js"]
```

Environment variables to set in Railway dashboard:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GEMINI_API_KEY`
- `FRONTEND_URL`
- `PORT=3001`

---

# 13. Error Handling Strategy

## 13.1 Frontend Error Boundaries

All route-level pages wrapped in React error boundaries. Error boundary logs to console in development, silent in production.

---

## 13.2 Sync Error Handling

```text
On sync item failure:
  â†’ increment retry_count
  â†’ if retry_count < SYNC_RETRY_LIMIT: requeue as "pending"
  â†’ if retry_count >= SYNC_RETRY_LIMIT: mark as "failed", surface toast to user
```

---

## 13.3 AI Error Handling

```text
On Gemini API error:
  â†’ log error to ai_logs with error field populated
  â†’ return fallback message: "I couldn't understand that. Try rephrasing."
  â†’ do not throw to the client
```

---

## 13.4 Backend HTTP Error Codes

| Scenario                          | HTTP Code |
| --------------------------------- | --------- |
| Missing or invalid JWT            | 401       |
| Accessing another user's resource | 403       |
| Resource not found                | 404       |
| Validation failure                | 400       |
| Gemini API unavailable            | 503       |
| Unexpected server error           | 500       |

---

# 14. Testing Strategy

## 14.1 Unit Tests (Vitest)

Targets:

- `packages/parser` â€” intent detection accuracy per intent
- `packages/shared` â€” utility functions
- `packages/ai-core` â€” response parser

Parser test format:

```typescript
describe("log_expense intent", () => {
  it("detects amount from 'lunch 120'", () => {
    const result = routeIntent("lunch 120");
    expect(result.intent).toBe("log_expense");
    expect(result.data.amount).toBe(120);
    expect(result.data.category).toBe("food");
  });
});
```

---

## 14.2 Integration Tests

Targets:

- Dexie CRUD operations
- Sync engine flush logic
- REST route handlers

---

## 14.3 Day 1 Acceptance Criteria

| Test                                 | Expected Result                                  |
| ------------------------------------ | ------------------------------------------------ |
| `GET /health`                        | `{ ok: true }`                                   |
| Register with valid email + password | User created in Supabase Auth and `public.users` |
| Login with valid credentials         | Session established, redirect to `/dashboard`    |
| Access `/dashboard` without session  | Redirect to `/login`                             |
| All 9 Supabase tables exist          | Confirmed via Supabase dashboard                 |
| Frontend deployed on Vercel          | URL accessible and loads login page              |
| Backend deployed on Railway          | Health check returns 200                         |

---

# 15. Sprint Day Mapping

| Day   | LLD Sections Implemented                                                                                |
| ----- | ------------------------------------------------------------------------------------------------------- |
| Day 1 | Section 2 (Monorepo), Section 4 (DB Schema), Section 6.2â€“6.4 (Auth), Section 7.2â€“7.4 (Backend scaffold) |
| Day 2 | Section 3 (database-types), Section 6.5 (Dexie), Section 6.6 (Hooks)                                    |
| Day 3 | Section 6.1 (UI components), Section 10 (Notifications)                                                 |
| Day 4 | Section 6.7 (Sync Engine), Section 7.5â€“7.6 (Sync + CRUD routers)                                        |
| Day 5 | Section 8 (parser package)                                                                              |
| Day 6 | Section 9 (ai-core), Section 7.7 (AI router)                                                            |
| Day 7 | PWA manifest, service worker, bug fixes                                                                 |


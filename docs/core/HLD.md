# High-Level Design (HLD)

# UniLife.AI

Version: 1.0

Document Type: High-Level Design

Product: UniLife.AI – AI-Powered Student Life Companion

---

# 1. Introduction

## 1.1 Purpose

This document describes the high-level architecture and system design of UniLife.A.

The purpose of this document is to define the major architectural components, system interactions, technology stack, deployment strategy, and key design decisions for the UniLife.A platform.

---

## 1.2 System Overview

UniLife.A is an AI-powered student life management platform designed to help students manage:

- Class schedules
- Assignments
- Exams
- Allowance and expenses
- Time management

The platform follows an Offline-First architecture where critical productivity features remain available without internet connectivity.

Artificial Intelligence acts as an enhancement layer rather than a dependency layer.

---

# 2. Architectural Goals

The system is designed around the following goals.

## AG-001 Offline First

Students must be able to access and manage their academic and financial information without requiring an internet connection.

---

## AG-002 AI Assisted Experience

AI should simplify user interactions through natural language while remaining optional.

---

## AG-003 Cost Efficient AI Operations

AI services should be invoked only when necessary to minimize operational costs.

---

## AG-004 Scalability

The architecture should support future growth in users, AI workloads, and feature expansion.

---

## AG-005 Maintainability

System components should be modular and independently deployable.

---

# 3. Architectural Style

UniLife.A follows a layered architecture with AI-assisted workflows.

```text
Presentation Layer
        ↓
Application Layer
        ↓
AI Processing Layer
        ↓
Data Layer
```

This approach separates concerns and improves maintainability.

---

# 4. System Context Diagram

```text
┌─────────────────┐
│     Student     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    UniLife.A     │
└────────┬────────┘
         │
         ├────────────► Gemini API
         │
         ├────────────► Supabase
         │
         └────────────► Push Notification Services
```

---

# 5. High-Level Architecture

```text
┌────────────────────────────────────┐
│            Frontend PWA            │
│             Next.js                │
└─────────────────┬──────────────────┘
                  │
                  ▼
┌────────────────────────────────────┐
│         Local AI Processing        │
│                                    │
│  Intent Router                     │
│  Compromise NLP                    │
│  Chrono Parser                     │
│  Zod Validation                    │
└─────────────────┬──────────────────┘
                  │
                  ▼
┌────────────────────────────────────┐
│           IndexedDB                │
│         (Dexie Storage)            │
└─────────────────┬──────────────────┘
                  │
                  ▼
┌────────────────────────────────────┐
│           Sync Engine              │
└─────────────────┬──────────────────┘
                  │
                  ▼
┌────────────────────────────────────┐
│          Hono Backend              │
│           REST API                 │
└─────────────────┬──────────────────┘
                  │
        ┌─────────┴─────────┐
        ▼                   ▼
┌──────────────┐   ┌────────────────┐
│  Supabase    │   │ Gemini Flash   │
│ PostgreSQL   │   │ AI Services    │
└──────────────┘   └────────────────┘
```

---

# 6. Core Components

## 6.1 Frontend Application

Technology:

- Next.js
- TypeScript
- Tailwind CSS
- PWA

Responsibilities:

- User Interface
- Offline Data Access
- Local Notifications
- Local AI Processing
- Synchronization

---

## 6.2 Local AI Processing Layer

Technology:

- Compromise
- Chrono
- Zod

Responsibilities:

- Offline intent detection
- Offline entity extraction
- Offline command execution
- Input validation

This layer processes simple commands without internet connectivity.

Examples:

```text
assignment tomorrow 9pm

may pasok ako tuesday 10am

lunch 120
```

---

## 6.3 IndexedDB Layer

Technology:

- Dexie.js

Responsibilities:

- Local storage
- Offline CRUD
- Pending sync queue
- Cache management

IndexedDB acts as the primary offline datastore.

---

## 6.4 Synchronization Engine

Responsibilities:

- Detect connectivity
- Upload pending changes
- Download remote changes
- Conflict resolution

The synchronization engine ensures eventual consistency between local and cloud data.

---

## 6.5 Backend Layer

Technology:

- Hono
- Hono REST API

Responsibilities:

- Authentication
- CRUD APIs
- Synchronization APIs
- AI orchestration
- Notification scheduling

---

## 6.6 Database Layer

Technology:

- Supabase PostgreSQL

Responsibilities:

- Persistent storage
- User management
- Cloud synchronization
- Row-level security

Supabase serves as the system's source of truth.

---

## 6.7 AI Service Layer

Technology:

- Gemini Flash

Responsibilities:

- Natural language understanding
- Intent fallback
- Planning assistance
- Recommendation generation

Gemini is used only when local processing confidence is insufficient.

---

# 7. AI Processing Architecture

## 7.1 Offline Processing Flow

```text
User Input
      ↓
Intent Router
      ↓
Compromise NLP
      ↓
Chrono Parser
      ↓
Zod Validation
      ↓
Structured Action
      ↓
IndexedDB
```

Example:

```text
assignment tuesday 9pm
```

Produces:

```json
{
  "intent": "create_assignment",
  "deadline": "2026-06-09T21:00:00Z"
}
```

---

## 7.2 AI Fallback Flow

```text
User Input
      ↓
Intent Router
      ↓
Low Confidence
      ↓
Gemini Flash
      ↓
Structured JSON
      ↓
Validation
      ↓
Database Action
```

Example:

```text
May kailangan akong tapusin bago reporting namin pagkatapos ng klase sa Thursday.
```

---

# 8. Data Flow Design

## 8.1 Offline CRUD Flow

```text
Student
   ↓
Frontend
   ↓
Local Parser
   ↓
IndexedDB
   ↓
UI Updated
```

No internet required.

---

## 8.2 Synchronization Flow

```text
IndexedDB
      ↓
Pending Queue
      ↓
Sync Engine
      ↓
Hono API
      ↓
Supabase
```

---

## 8.3 Online AI Flow

```text
Student
     ↓
Frontend
     ↓
Backend
     ↓
Gemini Flash
     ↓
Response
     ↓
Student
```

---

# 9. Database Design Overview

## Core Tables

### users

Stores user profiles.

### classes

Stores recurring class schedules.

### assignments

Stores assignment information.

### exams

Stores examination schedules.

### expenses

Stores allowance and expense records.

### notifications

Stores notification schedules.

### sync_queue

Tracks pending synchronization events.

### ai_logs

Stores AI interactions for debugging and analytics.

---

# 10. Offline First Design

## Offline Capabilities

Supported offline:

- View schedules
- Create schedules
- Edit schedules
- Create assignments
- Track exams
- Log expenses
- View allowance status
- Local notifications

---

## Online Capabilities

Require internet:

- AI planning
- AI recommendations
- AI tutoring
- AI summaries
- Cloud synchronization
- Authentication

---

# 11. Security Architecture

## Authentication

Technology:

- Supabase Auth

Features:

- Email authentication
- Session management
- Password recovery

---

## Authorization

Technology:

- Row Level Security (RLS)

Rules:

- Users access only their own records.
- All API requests must be authenticated.

---

## Data Protection

Measures:

- HTTPS encryption
- JWT authentication
- Secure cookie handling
- Database access restrictions

---

# 12. Deployment Architecture

## Frontend

Platform:

- Vercel

Responsibilities:

- Host Next.js application
- Deliver PWA assets

---

## Backend

Platform:

- Railway

Responsibilities:

- Host Hono API
- Host REST endpoints

---

## Database

Platform:

- Supabase

Responsibilities:

- Persistent storage
- Authentication
- Security

---

## AI

Platform:

- Gemini API

Responsibilities:

- AI processing
- Recommendations
- Planning

---

# 13. Monorepo Structure

```text
UniLife.A/

├── apps
│   ├── frontend
│   └── backend
│
├── packages
│   ├── parser
│   ├── ai-core
│   ├── shared
│   └── database-types
│
├── turbo.json
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

---

# 14. Scalability Strategy

The system supports scaling through:

- Stateless backend services
- Independent AI services
- Horizontal API scaling
- Managed database services
- CDN-backed frontend delivery

Future scaling can be achieved without significant architectural changes.

---

# 15. Risks and Mitigations

| Risk                | Mitigation                     |
| ------------------- | ------------------------------ |
| AI API Downtime     | Offline parser fallback        |
| Network Instability | Offline-first architecture     |
| High AI Costs       | Local processing before Gemini |
| Data Loss           | Sync queue and retry strategy  |
| Parsing Ambiguity   | Gemini fallback validation     |

---

# 16. Future Architecture Evolution

Phase 2:

- AI Study Tutor
- AI Quiz Generation
- AI Flashcards

Phase 3:

- Calendar Integrations
- Note Summarization
- Study Planner

Phase 4:

- University Portal Integrations
- LMS Integrations
- Career Planning Features

---

# 17. Technology Stack Summary

| Layer           | Technology                  |
| --------------- | --------------------------- |
| Frontend        | Next.js                     |
| Styling         | Tailwind CSS                |
| Offline Storage | Dexie + IndexedDB           |
| Local NLP       | Compromise                  |
| Date Parsing    | Chrono                      |
| Validation      | Zod                         |
| Backend         | Hono                        |
| API Layer       | Hono REST API               |
| Database        | Supabase PostgreSQL         |
| Authentication  | Supabase Auth               |
| AI              | Gemini Flash                |
| Monorepo        | PNPM Workspace              |
| Build System    | Turborepo                   |
| Testing         | Vitest                      |
| Deployment      | Vercel + Railway + Supabase |

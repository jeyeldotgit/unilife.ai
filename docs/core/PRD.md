# Product Requirements Document (PRD)

# UniLife.AI

**Version:** 1.0 MVP

**Product Type:** AI-Powered Student Life Companion

**Platform:** Progressive Web App (PWA)

**Target Users:** College and University Students

---

# 1. Product Overview

## Vision

UniLife.A is an AI-powered student companion that helps university students manage classes, assignments, deadlines, free time, and allowance through natural language conversations.

The product aims to reduce academic stress and improve student productivity by serving as a digital companion capable of organizing and planning student life.

---

# 2. Problem Statement

Students typically manage their academic and personal responsibilities across multiple applications such as calendars, note-taking apps, task managers, and finance trackers.

Common challenges include:

- Missing assignment deadlines
- Forgetting class schedules
- Poor time management
- Difficulty identifying available free time
- Running out of allowance before the next budget cycle
- Information scattered across multiple applications

Students need a single intelligent companion that understands their academic schedule, tasks, and financial situation.

---

# 3. Goals

## Business Goals

- Increase student productivity
- Build a daily-use student platform
- Achieve high retention through AI-driven engagement
- Support a freemium subscription model

## User Goals

- Easily manage classes and assignments
- Understand upcoming deadlines
- Find available free time
- Track allowance and expenses
- Receive actionable recommendations

---

# 4. Target Users

## Primary Users

### College Students

Characteristics:

- Ages 17–25
- Managing multiple classes
- Budget-conscious
- Mobile-first users

Pain Points:

- Deadline overload
- Poor schedule organization
- Allowance management issues

---

# 5. Product Scope

## Included in MVP

### Academic Management

- Class scheduling
- Assignment tracking
- Exam tracking
- Deadline reminders

### AI Companion

- Natural language CRUD
- Academic queries
- Free time analysis
- Daily briefings

### Allowance Management

- Budget setup
- Expense logging
- Spending analysis
- Allowance survival forecasting

### Offline Support

- Offline data access
- Offline data creation
- Automatic synchronization

---

## Excluded from MVP

- Learning Management System integration
- University portal integration
- Resume builder
- Internship tracking
- Group collaboration
- Social networking features

---

# 6. User Stories

## Academic

### US-001

As a student, I want to create a class schedule using natural language so that I do not need to manually fill forms.

### US-002

As a student, I want to create assignments through chat so that task creation is faster.

### US-003

As a student, I want to ask what deadlines I have so that I can prioritize work.

---

## Planning

### US-004

As a student, I want to know when I am free so that I can schedule personal activities.

### US-005

As a student, I want AI recommendations about what to work on next.

---

## Finance

### US-006

As a student, I want to log expenses through chat.

### US-007

As a student, I want to know whether my allowance will last until the next budget cycle.

---

# 7. Functional Requirements

## FR-001 User Authentication

The system shall:

- Allow user registration
- Allow login/logout
- Support password reset
- Support session management

---

## FR-002 AI Companion

The system shall:

- Accept natural language input
- Interpret user intent
- Generate structured actions
- Execute CRUD operations

Supported intents:

- Create Class
- Update Class
- Delete Class
- Create Assignment
- Update Assignment
- Delete Assignment
- Create Exam
- Log Expense
- Query Schedule
- Query Budget
- Query Deadlines

---

## FR-003 Schedule Management

The system shall:

- Create classes
- Edit classes
- Delete classes
- Support recurring schedules
- Display weekly schedules

---

## FR-004 Assignment Management

The system shall:

- Create assignments
- Edit assignments
- Delete assignments
- Mark assignments complete
- Track due dates

---

## FR-005 Exam Management

The system shall:

- Create exams
- Edit exams
- Delete exams
- Display exam countdowns

---

## FR-006 Free Time Finder

The system shall:

- Analyze schedules
- Analyze assignments
- Analyze exams
- Calculate available time slots
- Recommend optimal free periods

---

## FR-007 Daily Briefing

The system shall generate:

- Today's classes
- Upcoming deadlines
- Budget status
- Recommended focus task

---

## FR-008 Expense Logging

The system shall:

- Record expenses
- Categorize expenses
- Edit expenses
- Delete expenses

Supported categories:

- Food
- Transportation
- School
- Entertainment
- Miscellaneous

---

## FR-009 Budget Management

The system shall:

- Create budgets
- Track spending
- Calculate remaining allowance
- Calculate spending trends

---

## FR-010 Allowance Forecast

The system shall:

- Estimate remaining days before budget depletion
- Analyze spending rate
- Provide spending recommendations

---

## FR-011 Notifications

The system shall support:

### Class Notifications

- 30 minutes before class

### Assignment Notifications

- 7 days before
- 3 days before
- 1 day before
- 3 hours before

### Exam Notifications

- 14 days before
- 7 days before
- 3 days before
- 1 day before

---

## FR-012 Offline Mode

The system shall:

- Store data locally
- Allow offline CRUD operations
- Queue pending synchronization
- Automatically sync when online

---

## FR-013 Subscription Management

The system shall support:

### Free Tier

- Schedule Management
- Assignment Management
- Exam Tracking
- Expense Tracking
- Limited AI Usage

### Premium Tier

- Unlimited AI Usage
- AI Study Tutor
- AI Quiz Generation
- AI Summarization
- Advanced Planning

---

# 8. Non-Functional Requirements

## NFR-001 Performance

- Dashboard load time < 2 seconds
- AI response time < 5 seconds
- Offline actions < 500 ms

---

## NFR-002 Availability

- System uptime ≥ 99.5%

---

## NFR-003 Scalability

The system shall support:

- 10,000+ users
- Horizontal API scaling
- Concurrent AI requests

---

## NFR-004 Security

The system shall:

- Encrypt data in transit
- Encrypt sensitive data at rest
- Use secure authentication
- Enforce Row Level Security (RLS)

---

## NFR-005 Privacy

The system shall:

- Comply with applicable privacy regulations
- Allow users to delete accounts
- Allow users to export data

---

## NFR-006 Reliability

The system shall:

- Prevent data loss during synchronization
- Retry failed synchronization jobs
- Maintain offline queue integrity

---

## NFR-007 Maintainability

The system shall:

- Follow modular architecture
- Support independent service deployment
- Maintain API documentation

---

# 9. System Architecture

UniLAIfe follows an Offline-First, AI-Assisted Architecture.

The system is designed so that core student productivity features remain fully functional without internet connectivity, while AI capabilities act as an enhancement layer.

---

## Frontend Layer

### Technology Stack

- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui
- Progressive Web App (PWA)

### Responsibilities

- User Interface
- Local State Management
- Offline Data Access
- Local Notifications
- AI Chat Interface
- Synchronization Management

---

## Local AI Processing Layer

### Technology Stack

- Compromise
- Chrono
- Zod

### Responsibilities

- Intent Detection
- Entity Extraction
- Date and Time Parsing
- Input Validation
- Offline Command Processing

This layer enables natural language CRUD operations without requiring internet access.

Examples:

```text
assignment tomorrow 9pm

may pasok ako sa martes 10am

nagastos ko 120 sa lunch
```

Processing Flow:

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
```

---

## Offline Storage Layer

### Technology Stack

- Dexie.js
- IndexedDB

### Responsibilities

- Offline Data Storage
- Local CRUD Operations
- Pending Sync Queue
- Local Cache Management

IndexedDB acts as the primary datastore while the device is offline.

---

## Synchronization Layer

### Responsibilities

- Connectivity Detection
- Upload Pending Changes
- Download Remote Updates
- Conflict Resolution
- Data Reconciliation

Synchronization occurs automatically when connectivity is restored.

Flow:

```text
IndexedDB
      ↓
Sync Queue
      ↓
Backend API
      ↓
Supabase
```

---

## Backend Layer

### Technology Stack

- Hono
- tRPC
- TypeScript

### Responsibilities

- API Layer
- Authentication
- Business Logic
- Synchronization Services
- AI Orchestration
- Notification Scheduling

The backend acts as the orchestration layer between clients, AI services, and the database.

---

## Database Layer

### Technology Stack

- Supabase PostgreSQL

### Responsibilities

- Persistent Data Storage
- User Management
- Synchronization Source of Truth
- Analytics Storage
- Security Enforcement

Supabase serves as the authoritative source of data.

### Core Tables

#### Identity

- users

#### Academic

- classes
- assignments
- exams

#### Financial

- expenses
- budgets

#### System

- notifications
- sync_queue
- ai_logs

---

## Cloud AI Layer

### Primary Model

- Gemini Flash

### Responsibilities

- AI Fallback Processing
- Ambiguous Intent Resolution
- Planning Assistance
- Recommendation Generation
- Daily Briefing Generation

Gemini Flash is only invoked when local processing confidence is insufficient or advanced reasoning is required.

Examples:

```text
What should I do today?

Plan my week.

Will my allowance last until Friday?

When should I start studying?
```

---

### Future Premium Model

- Gemini Pro

### Responsibilities

- AI Study Tutor
- Quiz Generation
- Note Summarization
- Advanced Academic Planning
- Personalized Study Coaching

---

## Complete System Flow

### Offline Flow

```text
Student
   ↓
Next.js PWA
   ↓
Local AI Processing
   ↓
IndexedDB
   ↓
Immediate Response
```

No internet required.

---

### Synchronization Flow

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

Triggered automatically when online.

---

### AI Fallback Flow

```text
Student Message
        ↓
Intent Router
        ↓
Confidence Check
        ↓
Low Confidence
        ↓
Gemini Flash
        ↓
Structured Action
        ↓
Database Update
        ↓
Response
```

---

## Monorepo Architecture

```text
unilaife/

├── apps
│   ├── frontend
│   └── backend
│
├── packages
│   ├── parser
│   │   ├── compromise
│   │   ├── chrono
│   │   └── zod
│   │
│   ├── ai-core
│   ├── shared
│   └── database-types
│
├── turbo.json
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

---

## Architectural Principle

```text
Offline Layer
↓
Student Survival Functions

Online Layer
↓
Student Intelligence Functions
```

### Offline Functions

- Schedule Management
- Assignment Tracking
- Exam Tracking
- Expense Logging
- Allowance Tracking
- Local Notifications

### Online Functions

- AI Planning
- AI Recommendations
- AI Study Assistance
- Daily Briefings
- Cloud Synchronization

This architecture ensures UniLAIfe remains fully usable even when internet connectivity or AI services are unavailable.

This version reflects the actual architecture you've decided on:

---

# 10. Success Metrics

## Product Metrics

- Daily Active Users (DAU)
- Monthly Active Users (MAU)
- User Retention Rate
- Premium Conversion Rate

## Engagement Metrics

- Tasks Created
- Expenses Logged
- AI Messages Sent
- Daily Briefing Open Rate

## Business Metrics

- Monthly Recurring Revenue (MRR)
- Customer Acquisition Cost (CAC)
- Lifetime Value (LTV)

---

# 11. Future Enhancements

## Phase 2

- AI Study Tutor
- AI Quiz Generator
- AI Flashcards
- Note Summarization

## Phase 3

- Google Calendar Sync
- Google Drive Integration
- Internship Tracker
- Career Planning

## Phase 4

- University Integrations
- LMS Integrations
- Student Communities
- Peer Study Groups

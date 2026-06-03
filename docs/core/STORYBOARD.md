# UniLife.AI — User Stories Storyboard & UI Wireframes

**Version:** 1.0 MVP  
**Document Type:** Storyboard + Wireframes  
**Product:** UniLife.AI – AI-Powered Student Life Companion

---

## How to Read This Document

Each story follows this structure:

```
User Story → Scenario → Storyboard Panels → UI Wireframe → Acceptance Criteria
```

Wireframes use ASCII art to convey layout and component placement.  
Annotations use `[ ]` for interactive elements, `< >` for dynamic content, and `---` for dividers.

---

---

# STORY 1 — Registration & Onboarding

**User Story (US-001 adjacent)**  
_As a new student, I want to create an account quickly so that I can start organizing my school life._

---

## Scenario

Maria is a first-year college student. She discovers UniLife.AI through a classmate. She opens the app on her phone and needs to register before she can use it.

---

## Storyboard Panels

```
Panel 1                    Panel 2                    Panel 3
┌─────────────────┐        ┌─────────────────┐        ┌─────────────────┐
│                 │        │                 │        │                 │
│   📱 App Icon   │  ───▶  │  Welcome Screen │  ───▶  │  Registration   │
│   on phone      │        │  with logo      │        │  Form           │
│                 │        │                 │        │                 │
└─────────────────┘        └─────────────────┘        └─────────────────┘
 Maria taps the app         She sees a clean            She fills in her
 icon from her              landing page with           email, name, and
 home screen.               a "Get Started"             password.
                            button.
```

```
Panel 4                    Panel 5
┌─────────────────┐        ┌─────────────────┐
│                 │        │                 │
│  Onboarding     │  ───▶  │  Dashboard      │
│  Setup Wizard   │        │  (First View)   │
│                 │        │                 │
└─────────────────┘        └─────────────────┘
 App asks her budget        She lands on the
 period and first           empty dashboard,
 budget amount.             ready to begin.
```

---

## UI Wireframe — Welcome / Landing Page

```
┌─────────────────────────────────┐
│                                 │
│                                 │
│          ◉ UniLife.AI           │
│                                 │
│    Your AI Student Companion    │
│                                 │
│                                 │
│   ████████████████████████████  │
│   █  Get Started — It's Free █  │
│   ████████████████████████████  │
│                                 │
│   Already have an account?      │
│   [ Log In ]                    │
│                                 │
└─────────────────────────────────┘
```

---

## UI Wireframe — Registration Screen

```
┌─────────────────────────────────┐
│  ←  Create your account         │
│─────────────────────────────────│
│                                 │
│  Display Name                   │
│  ┌───────────────────────────┐  │
│  │ e.g. Maria Santos         │  │
│  └───────────────────────────┘  │
│                                 │
│  Email Address                  │
│  ┌───────────────────────────┐  │
│  │ maria@university.edu      │  │
│  └───────────────────────────┘  │
│                                 │
│  Password  (min 8 characters)   │
│  ┌───────────────────────────┐  │
│  │ ••••••••••                │  │
│  └───────────────────────────┘  │
│                                 │
│  ████████████████████████████   │
│  █     Create Account        █   │
│  ████████████████████████████   │
│                                 │
│  ! Email must be valid format   │  ← inline error state
│                                 │
└─────────────────────────────────┘
```

---

## UI Wireframe — Onboarding: Budget Setup

```
┌─────────────────────────────────┐
│  Step 2 of 2 — Set your budget  │
│  ●●○                            │
│─────────────────────────────────│
│                                 │
│  How often do you receive       │
│  your allowance?                │
│                                 │
│  ┌─────────┐ ┌─────────────┐   │
│  │ Weekly  │ │  Bi-Weekly  │   │
│  └─────────┘ └─────────────┘   │
│  ┌──────────────┐              │
│  │   Monthly    │              │
│  └──────────────┘              │
│                                 │
│  Budget Amount (PHP)            │
│  ┌───────────────────────────┐  │
│  │  ₱ 3,000.00               │  │
│  └───────────────────────────┘  │
│                                 │
│  ████████████████████████████   │
│  █    Let's Go! →            █  │
│  ████████████████████████████   │
│                                 │
└─────────────────────────────────┘
```

---

## Acceptance Criteria

- [ ] User can register with email, password, and display name
- [ ] Inline validation shows errors before form submission
- [ ] Onboarding collects budget period and amount
- [ ] On completion, user lands on dashboard with empty state
- [ ] If user already has account, login link is accessible

---

---

# STORY 2 — View Daily Dashboard (Daily Briefing)

**User Story (US-003 adjacent / FR-007)**  
_As a student, I want to see a summary of my day when I open the app so that I know what to focus on._

---

## Scenario

Juan opens UniLife.AI at 7:45 AM before his morning commute. He wants a quick overview of what today looks like — his classes, deadlines, and whether he has enough budget for the day.

---

## Storyboard Panels

```
Panel 1                    Panel 2                    Panel 3
┌─────────────────┐        ┌─────────────────┐        ┌─────────────────┐
│                 │        │                 │        │                 │
│  Juan taps app  │  ───▶  │  Dashboard      │  ───▶  │  He taps a      │
│  at 7:45 AM     │        │  loads briefing │        │  deadline card  │
│                 │        │                 │        │                 │
└─────────────────┘        └─────────────────┘        └─────────────────┘
 Opens app on his           He sees today's             He navigates to
 commute. No               classes, 2 deadlines,       the Assignments
 internet needed.           and budget status.          detail screen.
```

---

## UI Wireframe — Dashboard

```
┌─────────────────────────────────┐
│  Good morning, Juan ☀️          │
│  Wednesday, June 3              │
│─────────────────────────────────│
│                                 │
│  ╔═══════════════════════════╗  │
│  ║  🗓  TODAY'S CLASSES       ║  │
│  ╠═══════════════════════════╣  │
│  ║  08:00  Math 101  — RM 3A ║  │
│  ║  10:30  Eng Lit  — RM 12  ║  │
│  ║  13:00  PE       — Gym    ║  │
│  ╚═══════════════════════════╝  │
│                                 │
│  ╔═══════════════════════════╗  │
│  ║  📋  UPCOMING DEADLINES    ║  │
│  ╠═══════════════════════════╣  │
│  ║  ⚠️  Research Paper  2d    ║  │
│  ║  📝  Quiz Review    5d    ║  │
│  ╚═══════════════════════════╝  │
│                                 │
│  ╔═══════════════════════════╗  │
│  ║  💰  BUDGET STATUS         ║  │
│  ╠═══════════════════════════╣  │
│  ║  ₱ 1,240 remaining         ║  │
│  ║  ████████░░░░  62% left    ║  │
│  ║  Est. lasts 4 more days   ║  │
│  ╚═══════════════════════════╝  │
│                                 │
│  ╔═══════════════════════════╗  │
│  ║  🤖  AI SUGGESTS           ║  │
│  ╠═══════════════════════════╣  │
│  ║  Start Research Paper     ║  │
│  ║  today — due in 2 days.   ║  │
│  ╚═══════════════════════════╝  │
│                                 │
│─────────────────────────────────│
│  🏠 Schedule  📋 Tasks  💬 Chat │  ← bottom nav
└─────────────────────────────────┘
```

---

## Acceptance Criteria

- [ ] Dashboard loads from IndexedDB (works offline)
- [ ] Shows today's classes sorted by start time
- [ ] Shows upcoming deadlines within 7 days, sorted by urgency
- [ ] Shows active budget remaining amount and progress bar
- [ ] AI suggestion card visible when online; hidden when offline
- [ ] Tapping a class navigates to Schedule view
- [ ] Tapping a deadline navigates to Assignments view

---

---

# STORY 3 — Create Assignment via Natural Language (Chat)

**User Story (US-002)**  
_As a student, I want to create assignments through chat so that task creation is faster._

---

## Scenario

Lea just came out of her English class and her professor announced a book report due next Friday. She opens the chat and types it in natural language instead of filling a form.

---

## Storyboard Panels

```
Panel 1                    Panel 2                    Panel 3
┌─────────────────┐        ┌─────────────────┐        ┌─────────────────┐
│                 │        │                 │        │                 │
│  Lea taps       │  ───▶  │  She types into │  ───▶  │  App confirms   │
│  Chat tab       │        │  the chat input │        │  with a card    │
│                 │        │                 │        │                 │
└─────────────────┘        └─────────────────┘        └─────────────────┘
 She opens the              "book report next          A confirmation
 AI chat screen             friday 11:59pm"            bubble appears
 from the nav bar.                                     with assignment
                                                       details.
```

```
Panel 4
┌─────────────────┐
│                 │
│  Assignment     │
│  appears in     │
│  task list      │
│                 │
└─────────────────┘
 She checks the
 Assignments screen
 and sees it listed.
```

---

## UI Wireframe — Chat Screen (Before Input)

```
┌─────────────────────────────────┐
│  💬  Chat with UniLife           │
│─────────────────────────────────│
│                                 │
│     ╭─────────────────────╮     │
│     │ 👋 Hey Lea! What    │     │
│     │ would you like to   │     │
│     │ do today?           │     │
│     ╰─────────────────────╯     │
│                                 │
│  Quick actions:                 │
│  ┌──────────┐ ┌──────────────┐  │
│  │ + Task   │ │  + Expense   │  │
│  └──────────┘ └──────────────┘  │
│  ┌──────────┐ ┌──────────────┐  │
│  │ + Class  │ │ What's due?  │  │
│  └──────────┘ └──────────────┘  │
│                                 │
│                                 │
│                                 │
│                                 │
│─────────────────────────────────│
│  ┌───────────────────────┐ [→]  │
│  │ Type anything...      │      │
│  └───────────────────────┘      │
└─────────────────────────────────┘
```

---

## UI Wireframe — Chat Screen (After Input + Confirmation)

```
┌─────────────────────────────────┐
│  💬  Chat with UniLife           │
│─────────────────────────────────│
│                                 │
│     ╭─────────────────────╮     │
│     │ 👋 Hey Lea! What    │     │
│     │ would you like to   │     │
│     │ do today?           │     │
│     ╰─────────────────────╯     │
│                                 │
│              ╭───────────────╮  │
│              │ book report   │  │  ← user bubble (right)
│              │ next friday   │  │
│              │ 11:59pm       │  │
│              ╰───────────────╯  │
│                                 │
│  ╭──────────────────────────╮   │
│  │ ✅ Got it! I've added:   │   │  ← AI bubble (left)
│  │                          │   │
│  │  📋 Book Report          │   │
│  │  📅 Fri, Jun 12 11:59PM  │   │
│  │  🏷  No class linked      │   │
│  │                          │   │
│  │  [ View Assignment ]     │   │
│  ╰──────────────────────────╯   │
│                                 │
│─────────────────────────────────│
│  ┌───────────────────────┐ [→]  │
│  │ Type anything...      │      │
│  └───────────────────────┘      │
└─────────────────────────────────┘
```

---

## UI Wireframe — Assignments List (After Creation)

```
┌─────────────────────────────────┐
│  📋  Assignments                 │
│─────────────────────────────────│
│  [ All ] [ Pending ] [ Done ]   │
│─────────────────────────────────│
│                                 │
│  ┌─────────────────────────┐    │
│  │  ⚠️  DUE IN 2 DAYS       │    │
│  │  Research Paper         │    │
│  │  Math 101 · Jun 5       │    │
│  │  ○ Pending              │    │
│  └─────────────────────────┘    │
│                                 │
│  ┌─────────────────────────┐    │
│  │  📅  DUE IN 9 DAYS       │    │
│  │  Book Report  ← new!    │    │
│  │  No class · Jun 12      │    │
│  │  ○ Pending              │    │
│  └─────────────────────────┘    │
│                                 │
│  ┌─────────────────────────┐    │
│  │  ✅  COMPLETED            │    │
│  │  Lab Report             │    │
│  │  Bio 101 · Jun 1        │    │
│  └─────────────────────────┘    │
│                                 │
│─────────────────────────────────│
│  🏠 Schedule  📋 Tasks  💬 Chat │
└─────────────────────────────────┘
```

---

## Acceptance Criteria

- [ ] User can type natural language and create an assignment
- [ ] Local parser handles: `"[title] [date] [time]"` format
- [ ] Gemini fallback handles ambiguous or Filipino inputs
- [ ] AI confirmation bubble shows title, due date, and class link
- [ ] Assignment appears immediately in the Assignments screen
- [ ] Works offline (local parser only, no Gemini)

---

---

# STORY 4 — View Weekly Class Schedule

**User Story (US-001 / FR-003)**  
_As a student, I want to view my class schedule for the week so that I can plan my time._

---

## Scenario

Carlo wants to check if he has any afternoon classes on Thursday before agreeing to join a study group at 2 PM.

---

## Storyboard Panels

```
Panel 1                    Panel 2                    Panel 3
┌─────────────────┐        ┌─────────────────┐        ┌─────────────────┐
│                 │        │                 │        │                 │
│  Carlo taps     │  ───▶  │  Weekly grid    │  ───▶  │  He taps a      │
│  Schedule tab   │        │  loads          │        │  class block    │
│                 │        │                 │        │                 │
└─────────────────┘        └─────────────────┘        └─────────────────┘
 He navigates to            He sees Mon–Sat             A bottom sheet
 the Schedule tab           grid with all his           slides up with
 from the nav bar.          classes as blocks.          class details.
```

---

## UI Wireframe — Weekly Schedule View

```
┌─────────────────────────────────┐
│  🗓  Schedule                    │
│─────────────────────────────────│
│  ← Jun 2 – Jun 7 →              │
│─────────────────────────────────│
│       MON  TUE  WED  THU  FRI   │
│  8am  ─────────────────────── │
│       [M101]     [M101]         │
│  9am        [ENG]     [ENG]     │
│                                 │
│  10am ─────────────────────── │
│             [BIO]               │
│  11am                    [HIS] │
│                                 │
│  12pm ─────────────────────── │
│       LUNCH BREAK               │
│  1pm  ─────────────────────── │
│                    ← FREE →     │  ← Thursday PM is open!
│  2pm                            │
│                                 │
│  3pm  [PE]             [PE]    │
│                                 │
│  4pm  ─────────────────────── │
│                                 │
│  [ + Add Class ]                │
│─────────────────────────────────│
│  🏠 Schedule  📋 Tasks  💬 Chat │
└─────────────────────────────────┘
```

---

## UI Wireframe — Class Detail Bottom Sheet

```
┌─────────────────────────────────┐
│                                 │
│  ▬▬▬▬▬ (drag handle)            │
│                                 │
│  ■ Math 101                     │  ← colored indicator
│─────────────────────────────────│
│  📅  Monday & Wednesday         │
│  ⏰  08:00 – 09:30 AM           │
│  📍  Room 3A, Main Building     │
│  👨‍🏫  Prof. Reyes                │
│                                 │
│  Upcoming for this class:       │
│  ┌─────────────────────────┐    │
│  │ ⚠️  Research Paper  2d   │    │
│  └─────────────────────────┘    │
│                                 │
│  [ ✏️ Edit ]      [ 🗑 Delete ]  │
│                                 │
└─────────────────────────────────┘
```

---

## Acceptance Criteria

- [ ] Weekly grid displays Mon–Sat with time slots from 7 AM to 9 PM
- [ ] Current day column is visually highlighted
- [ ] Free slots are visually distinct from occupied slots
- [ ] Tapping a class block opens the detail bottom sheet
- [ ] Detail sheet shows subject, room, instructor, day, time
- [ ] Linked assignments are shown in detail sheet
- [ ] Edit and Delete actions are accessible from detail sheet
- [ ] Schedule loads from IndexedDB (works fully offline)

---

---

# STORY 5 — Log an Expense via Chat

**User Story (US-006 / FR-008)**  
_As a student, I want to log expenses through chat so that tracking spending is effortless._

---

## Scenario

Ana just bought lunch at the canteen for ₱85. She opens the chat and quickly logs it with a short message before she starts eating.

---

## Storyboard Panels

```
Panel 1                    Panel 2                    Panel 3
┌─────────────────┐        ┌─────────────────┐        ┌─────────────────┐
│                 │        │                 │        │                 │
│  Ana opens Chat │  ───▶  │  Types expense  │  ───▶  │  App confirms   │
│  after paying   │        │  in one line    │        │  and shows      │
│                 │        │                 │        │  remaining      │
└─────────────────┘        └─────────────────┘        └─────────────────┘
 She is at the              "lunch 85"                  ✅ Logged ₱85
 canteen checkout.                                      under Food.
                                                        Budget: ₱1,155
                                                        remaining.
```

---

## UI Wireframe — Chat: Expense Logged

```
┌─────────────────────────────────┐
│  💬  Chat with UniLife           │
│─────────────────────────────────│
│                                 │
│              ╭───────────────╮  │
│              │  lunch 85     │  │
│              ╰───────────────╯  │
│                                 │
│  ╭──────────────────────────╮   │
│  │ 💸 Expense logged!       │   │
│  │                          │   │
│  │  🍱 ₱ 85.00 — Food       │   │
│  │  📅 Today, 12:14 PM      │   │
│  │                          │   │
│  │  Budget remaining:       │   │
│  │  ₱ 1,155 of ₱ 1,500      │   │
│  │  ██████████░░░  77%      │   │
│  │                          │   │
│  │  [ View Expenses ]       │   │
│  ╰──────────────────────────╯   │
│                                 │
│─────────────────────────────────│
│  ┌───────────────────────┐ [→]  │
│  │ Type anything...      │      │
│  └───────────────────────┘      │
└─────────────────────────────────┘
```

---

## UI Wireframe — Expenses Screen

```
┌─────────────────────────────────┐
│  💰  Expenses                    │
│─────────────────────────────────│
│  ┌─────────────────────────┐    │
│  │  Weekly Budget          │    │
│  │  ₱ 1,155 / ₱ 1,500      │    │
│  │  ██████████░░░  77%     │    │
│  │  Est. lasts 4 more days │    │
│  └─────────────────────────┘    │
│─────────────────────────────────│
│  Spending by Category           │
│                                 │
│  🍱 Food          ₱ 245   41%   │
│  🚌 Transport     ₱ 100   17%   │
│  📚 School        ₱ 155   26%   │
│  🎮 Entertainment ₱  0     0%   │
│  📦 Misc          ₱ 100   17%   │
│─────────────────────────────────│
│  Recent Expenses                │
│                                 │
│  ┌─────────────────────────┐    │
│  │ 🍱 Lunch      ₱ 85      │    │
│  │ Today, 12:14 PM    [🗑] │    │
│  └─────────────────────────┘    │
│  ┌─────────────────────────┐    │
│  │ 🚌 Fare       ₱ 50      │    │
│  │ Today, 07:30 AM    [🗑] │    │
│  └─────────────────────────┘    │
│  ┌─────────────────────────┐    │
│  │ 📚 Photocopy  ₱ 30      │    │
│  │ Yesterday          [🗑] │    │
│  └─────────────────────────┘    │
│                                 │
│  [ + Log Expense ]              │
│─────────────────────────────────│
│  🏠 Schedule  📋 Tasks  💬 Chat │
└─────────────────────────────────┘
```

---

## Acceptance Criteria

- [ ] `"lunch 85"` creates a Food expense of ₱85
- [ ] `"fare 35"` creates a Transportation expense of ₱35
- [ ] Confirmation bubble shows amount, category, and updated budget
- [ ] Budget progress bar updates immediately
- [ ] Expense appears in the Expenses screen list
- [ ] Works fully offline
- [ ] Category auto-detected from keyword; defaults to Miscellaneous if unknown

---

---

# STORY 6 — Check Allowance Forecast

**User Story (US-007 / FR-010)**  
_As a student, I want to know whether my allowance will last until the next budget cycle._

---

## Scenario

Ben receives ₱2,000 every two weeks. It's Wednesday and he's been spending more than usual. He asks the AI if he'll make it to next Monday.

---

## Storyboard Panels

```
Panel 1                    Panel 2                    Panel 3
┌─────────────────┐        ┌─────────────────┐        ┌─────────────────┐
│                 │        │                 │        │                 │
│  Ben opens Chat │  ───▶  │  He asks the    │  ───▶  │  AI responds    │
│                 │        │  AI a question  │        │  with forecast  │
│                 │        │                 │        │                 │
└─────────────────┘        └─────────────────┘        └─────────────────┘
 Wednesday                  "will my allowance          Forecast shows
 afternoon.                 last until monday?"         burn rate and
 Budget is low.                                         recommendation.
```

---

## UI Wireframe — Chat: Allowance Forecast Response

```
┌─────────────────────────────────┐
│  💬  Chat with UniLife           │
│─────────────────────────────────│
│                                 │
│              ╭───────────────╮  │
│              │ will my       │  │
│              │ allowance     │  │
│              │ last until    │  │
│              │ monday?       │  │
│              ╰───────────────╯  │
│                                 │
│  ╭──────────────────────────╮   │
│  │ 📊 Allowance Forecast    │   │
│  │                          │   │
│  │  Remaining:  ₱ 420       │   │
│  │  Days left:  5 days      │   │
│  │  Avg/day:    ₱ 210/day   │   │
│  │                          │   │
│  │  ⚠️  At this rate, your  │   │
│  │  budget runs out in      │   │
│  │  ~2 days (Friday).       │   │
│  │                          │   │
│  │  💡 Tip: Keep daily      │   │
│  │  spending under ₱84 to   │   │
│  │  make it to Monday.      │   │
│  ╰──────────────────────────╯   │
│                                 │
│─────────────────────────────────│
│  ┌───────────────────────┐ [→]  │
│  │ Type anything...      │      │
│  └───────────────────────┘      │
└─────────────────────────────────┘
```

---

## Acceptance Criteria

- [ ] Query triggers when user asks budget/allowance survival questions
- [ ] Forecast shows: remaining amount, days left in cycle, average daily spend
- [ ] Warning shown if projected spend exceeds remaining budget before cycle end
- [ ] Recommended daily limit calculated and displayed
- [ ] Requires internet (Gemini handles this query); shows offline fallback if no connection

---

---

# STORY 7 — Create a Class via Chat (Filipino Input)

**User Story (US-001 / FR-002)**  
_As a student, I want to create a class schedule using natural language — including Filipino — so that I don't need to fill out forms._

---

## Scenario

Cris types his schedule in Filipino the way he would tell a friend. The app should understand him.

---

## Storyboard Panels

```
Panel 1                    Panel 2                    Panel 3
┌─────────────────┐        ┌─────────────────┐        ┌─────────────────┐
│                 │        │                 │        │                 │
│  Cris types in  │  ───▶  │  App processes  │  ───▶  │  Class appears  │
│  Filipino       │        │  via Gemini     │        │  in schedule    │
│                 │        │  fallback       │        │                 │
└─────────────────┘        └─────────────────┘        └─────────────────┘
 "may pasok ako sa         Local parser low            Class block added
 martes at huwebes         confidence →                to Tuesday and
 ng 10am biology"          Gemini processes            Thursday at 10am
                           the input.                  in weekly grid.
```

---

## UI Wireframe — Chat: Filipino Input Handled

```
┌─────────────────────────────────┐
│  💬  Chat with UniLife           │
│─────────────────────────────────│
│                                 │
│              ╭───────────────╮  │
│              │ may pasok ako │  │
│              │ sa martes at  │  │
│              │ huwebes ng    │  │
│              │ 10am biology  │  │
│              ╰───────────────╯  │
│                                 │
│  ╭──────────────────────────╮   │
│  │ ✅ Na-add na ang klase!   │   │
│  │                          │   │
│  │  📚 Biology              │   │
│  │  📅 Tuesday & Thursday   │   │
│  │  ⏰ 10:00 AM             │   │
│  │                          │   │
│  │  Tama ba ito?            │   │
│  │  [ ✓ Yes ] [ ✗ Edit ]    │   │
│  ╰──────────────────────────╯   │
│                                 │
│─────────────────────────────────│
│  ┌───────────────────────┐ [→]  │
│  │ Type anything...      │      │
│  └───────────────────────┘      │
└─────────────────────────────────┘
```

---

## Acceptance Criteria

- [ ] Filipino-language class input routes to Gemini fallback
- [ ] Gemini correctly extracts: subject, days, start time
- [ ] AI presents extracted data for user confirmation before saving
- [ ] User can confirm or edit before the record is created
- [ ] On confirm, class is written to IndexedDB and queued for sync
- [ ] Requires internet for this path; offline shows: "I need internet to understand that"

---

---

# STORY 8 — Receive a Deadline Reminder Notification

**User Story (US-003 / FR-011)**  
_As a student, I want to receive reminders before deadlines so that I never miss a submission._

---

## Scenario

Diana added a Physics lab report due on Friday at 11:59 PM. It's now Tuesday morning. She receives her 3-day reminder notification while her phone is in her pocket.

---

## Storyboard Panels

```
Panel 1                    Panel 2                    Panel 3
┌─────────────────┐        ┌─────────────────┐        ┌─────────────────┐
│                 │        │                 │        │                 │
│  Diana's phone  │  ───▶  │  Notification   │  ───▶  │  She taps it    │
│  vibrates       │        │  appears on     │        │  and opens the  │
│                 │        │  lock screen    │        │  assignment     │
└─────────────────┘        └─────────────────┘        └─────────────────┘
 Tuesday morning.           3-day reminder              She sees the
 She's in class.            for Physics                 assignment detail
                            Lab Report.                 and marks it
                                                        in-progress.
```

---

## UI Wireframe — Lock Screen Notification

```
┌─────────────────────────────────┐
│  9:02 AM                        │
│  Tuesday, June 3                │
│                                 │
│  ┌─────────────────────────┐    │
│  │  ◉ UniLife.AI           │    │
│  │─────────────────────────│    │
│  │  ⏰ Due in 3 days        │    │
│  │  Physics Lab Report     │    │
│  │  Friday, Jun 6 · 11:59  │    │
│  └─────────────────────────┘    │
│                                 │
└─────────────────────────────────┘
```

---

## UI Wireframe — Assignment Detail Screen

```
┌─────────────────────────────────┐
│  ←  Assignment Detail           │
│─────────────────────────────────│
│                                 │
│  Physics Lab Report             │
│                                 │
│  📅  Due: Fri, Jun 6, 11:59 PM  │
│  ⏳  3 days remaining           │
│  📚  Physics 102                │
│  🔥  Priority: High             │
│                                 │
│  Status                         │
│  ┌──────────┐ ┌───────────────┐ │
│  │ ○ Pending │ │ ● In Progress│ │
│  └──────────┘ └───────────────┘ │
│  ┌───────────┐                  │
│  │ ○ Done    │                  │
│  └───────────┘                  │
│                                 │
│  Description                    │
│  ┌─────────────────────────┐    │
│  │ (none added)            │    │
│  └─────────────────────────┘    │
│                                 │
│  Upcoming Reminders             │
│  ✅ 3-day reminder — sent       │
│  🔔 1-day reminder — Jun 5      │
│  🔔 3-hour reminder — Jun 6     │
│                                 │
│  [ ✏️ Edit ]    [ 🗑 Delete ]    │
│                                 │
└─────────────────────────────────┘
```

---

## Acceptance Criteria

- [ ] Notifications are scheduled when an assignment is created
- [ ] Assignment reminders fire at: 7d, 3d, 1d, 3h before due date
- [ ] Notifications work via Service Worker (background, no app open required)
- [ ] Tapping notification deep-links to the Assignment Detail screen
- [ ] Detail screen shows which reminders have been sent and which are pending
- [ ] Works fully offline (local notification scheduling only)

---

---

# STORY 9 — Offline Mode (No Internet)

**User Story (FR-012)**  
_As a student, I want the app to work even without internet so that I can still manage my tasks anywhere._

---

## Scenario

Kevin is on a province trip with no cellular signal. He still needs to check his schedule and log expenses during the trip.

---

## Storyboard Panels

```
Panel 1                    Panel 2                    Panel 3
┌─────────────────┐        ┌─────────────────┐        ┌─────────────────┐
│                 │        │                 │        │                 │
│  Kevin boards   │  ───▶  │  App shows      │  ───▶  │  He creates     │
│  the bus, no    │        │  offline banner │        │  tasks and logs │
│  signal         │        │                 │        │  expenses       │
└─────────────────┘        └─────────────────┘        └─────────────────┘
 He's in the               Small pill at the           Everything works
 province with             top says "Offline".         normally. Data
 no internet.              No full-screen              saved locally.
                           error.
```

```
Panel 4
┌─────────────────┐
│                 │
│  Signal returns │
│  → auto sync   │
│                 │
└─────────────────┘
 Bus arrives in
 town. Signal
 returns. App
 silently syncs
 all changes.
```

---

## UI Wireframe — Offline State (Dashboard)

```
┌─────────────────────────────────┐
│  ● Offline — changes saved      │  ← subtle top pill
│─────────────────────────────────│
│  Good morning, Kevin ☀️         │
│  Thursday, June 3               │
│─────────────────────────────────│
│                                 │
│  ╔═══════════════════════════╗  │
│  ║  🗓  TODAY'S CLASSES       ║  │
│  ╠═══════════════════════════╣  │
│  ║  (loaded from local data) ║  │
│  ╚═══════════════════════════╝  │
│                                 │
│  ╔═══════════════════════════╗  │
│  ║  🤖  AI SUGGESTS           ║  │
│  ╠═══════════════════════════╣  │
│  ║  ⚡ Offline — AI features  ║  │
│  ║  need internet.            ║  │
│  ╚═══════════════════════════╝  │
│                                 │
│─────────────────────────────────│
│  🏠 Schedule  📋 Tasks  💬 Chat │
└─────────────────────────────────┘
```

---

## UI Wireframe — Sync Status (Back Online)

```
┌─────────────────────────────────┐
│  ✅ Synced — all changes saved  │  ← success pill (auto-dismisses)
│─────────────────────────────────│
│  Good morning, Kevin ☀️         │
│  ...                            │
```

---

## Acceptance Criteria

- [ ] Offline indicator (pill banner) is shown when no internet detected
- [ ] All schedule, assignment, exam, and expense views load from IndexedDB
- [ ] CRUD operations work offline and are queued in sync_queue
- [ ] AI chat shows offline notice for AI-dependent queries
- [ ] Simple intents (log_expense, create_assignment) still work offline via local parser
- [ ] When internet returns, sync_engine flushes queue automatically
- [ ] Success banner confirms sync completion and auto-dismisses after 3 seconds

---

---

# STORY 10 — Ask What to Do Next (Free Time Finder)

**User Story (US-004, US-005 / FR-006)**  
_As a student, I want to know when I am free and what I should work on during that time._

---

## Scenario

It's Thursday 1 PM. Rina has a 2-hour gap before her next class. She asks the AI what she should do with that time.

---

## Storyboard Panels

```
Panel 1                    Panel 2                    Panel 3
┌─────────────────┐        ┌─────────────────┐        ┌─────────────────┐
│                 │        │                 │        │                 │
│  Rina sees a    │  ───▶  │  She asks the   │  ───▶  │  AI responds    │
│  gap in her     │        │  AI what to do  │        │  with a ranked  │
│  schedule       │        │                 │        │  task list      │
└─────────────────┘        └─────────────────┘        └─────────────────┘
 2-hour free               "what should I do          Shows: Research
 window on                 right now?"                Paper (due in 2d)
 Thursday 1 PM.                                       as top priority.
```

---

## UI Wireframe — Chat: Free Time Recommendation

```
┌─────────────────────────────────┐
│  💬  Chat with UniLife           │
│─────────────────────────────────│
│                                 │
│              ╭───────────────╮  │
│              │ what should I │  │
│              │ do right now? │  │
│              ╰───────────────╯  │
│                                 │
│  ╭──────────────────────────╮   │
│  │ 🕐 You have 2 hours free  │   │
│  │  before Physics at 3 PM. │   │
│  │                          │   │
│  │  Here's what I suggest:  │   │
│  │                          │   │
│  │  1. 🔥 Research Paper    │   │
│  │     Due in 2 days        │   │
│  │     Math 101             │   │
│  │                          │   │
│  │  2. 📋 Physics Lab Report│   │
│  │     Due in 3 days        │   │
│  │     Physics 102          │   │
│  │                          │   │
│  │  3. 📖 Quiz Review Notes │   │
│  │     Due in 5 days        │   │
│  │                          │   │
│  │  Start with the Research │   │
│  │  Paper — it's most       │   │
│  │  urgent. Good luck! 💪   │   │
│  ╰──────────────────────────╯   │
│                                 │
│─────────────────────────────────│
│  ┌───────────────────────┐ [→]  │
│  │ Type anything...      │      │
│  └───────────────────────┘      │
└─────────────────────────────────┘
```

---

## Acceptance Criteria

- [ ] AI detects next class time from schedule to define free window
- [ ] AI ranks pending assignments by due date and priority
- [ ] Top recommendation is the most urgent non-completed item
- [ ] Response includes the free window duration
- [ ] Requires internet (Gemini); offline fallback: shows assignment list sorted by urgency
- [ ] Response is in the user's detected language (Filipino or English)

---

---

# Summary — User Story Coverage Map

| Story | ID        | Feature Area        | Offline | AI Required |
| ----- | --------- | ------------------- | ------- | ----------- |
| 1     | US-NEW    | Registration        | No      | No          |
| 2     | FR-007    | Daily Briefing      | Yes     | Optional    |
| 3     | US-002    | Assignment via Chat | Yes     | Fallback    |
| 4     | US-001    | Weekly Schedule     | Yes     | No          |
| 5     | US-006    | Expense Logging     | Yes     | No          |
| 6     | US-007    | Allowance Forecast  | No      | Yes         |
| 7     | US-001    | Class via Filipino  | No      | Yes         |
| 8     | FR-011    | Notifications       | Yes     | No          |
| 9     | FR-012    | Offline Mode        | Yes     | No          |
| 10    | US-004/05 | Free Time Finder    | No      | Yes         |

---

_End of UniLife.AI User Stories Storyboard v1.0_

import type {
  AssignmentStatus as DomainAssignmentStatus,
  BudgetPeriod as DomainBudgetPeriod,
  DayOfWeek as DomainDayOfWeek,
  ExpenseCategory as DomainExpenseCategory,
} from "@unilife-ai/types";

export type DayOfWeek = DomainDayOfWeek;
export type BudgetPeriod = DomainBudgetPeriod;
export type ExpenseCategory = DomainExpenseCategory;
export type AssignmentStatus = DomainAssignmentStatus;

export type ApiRequestOptions = {
  offline?: boolean;
};

export type ScheduleColor = "blue" | "amber" | "green";

export type ScheduleDay = {
  dayIndex: number;
  dayOfWeek: DayOfWeek;
  shortLabel: string;
  dateLabel: string;
};

export type ScheduleAgendaItem = {
  id: string;
  subject: string;
  startTime: string;
  endTime: string;
  timeLabel: string;
  locationLabel: string;
};

export type LinkedAssignmentSummary = {
  id: string;
  title: string;
  dueLabel: string;
  status: AssignmentStatus;
  urgencyLabel: string;
};

export type ScheduleClass = {
  id: string;
  subject: string;
  dayOfWeek: DayOfWeek;
  dayIndex: number;
  startTime: string;
  endTime: string;
  timeLabel: string;
  gridHour: number;
  label: string;
  color: ScheduleColor;
  room: string | null;
  locationLabel: string;
  instructor: string | null;
  linkedAssignmentIds: string[];
};

export type FreeWindow = {
  id: string;
  dayOfWeek: DayOfWeek;
  dayIndex: number;
  startHour: number;
  endHour: number;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  label: string;
};

export type ScheduleClassDetail = ScheduleClass & {
  meetingLabel: string;
  assignments: LinkedAssignmentSummary[];
};

export type ScheduleWeek = {
  weekLabel: string;
  days: ScheduleDay[];
  hours: number[];
  classes: ScheduleClass[];
  freeWindows: FreeWindow[];
  todayClasses: ScheduleAgendaItem[];
  classDetails: Record<string, ScheduleClassDetail>;
};

export type AssignmentPriority = 1 | 2 | 3;
export type AssignmentReminderOffset = "7d" | "3d" | "1d" | "3h";
export type AssignmentReminderStatus = "pending" | "sent";

export type AssignmentUrgency = {
  label: string;
  icon: string;
  bgColor: string;
  textColor: string;
};

export type AssignmentReminder = {
  id: string;
  label: string;
  offset: AssignmentReminderOffset;
  status: AssignmentReminderStatus;
  scheduledFor: string;
  scheduledLabel: string;
  sentAt: string | null;
};

export type Assignment = {
  id: string;
  title: string;
  subject: string;
  classId: string | null;
  dueAt: string;
  dueDateLabel: string;
  icon: string;
  iconColor: string;
  status: AssignmentStatus;
  priority: AssignmentPriority;
  description: string | null;
  urgency: AssignmentUrgency;
  reminders: AssignmentReminder[];
  createdAt: string;
  updatedAt: string;
};

export type CreateAssignmentInput = {
  title: string;
  dueAt: string;
  subject?: string;
  classId?: string | null;
  description?: string | null;
  priority?: AssignmentPriority;
  icon?: string;
  iconColor?: string;
};

export type ExamUrgencyTone = "danger" | "warning" | "neutral";

export type ExamUrgency = {
  label: string;
  icon: string;
  bgColor: string;
  textColor: string;
  tone: ExamUrgencyTone;
};

export type Exam = {
  id: string;
  title: string;
  subject: string;
  classId: string | null;
  examAt: string;
  examDateLabel: string;
  examTimeLabel: string;
  examDateTimeLabel: string;
  countdownLabel: string;
  location: string | null;
  description: string | null;
  urgency: ExamUrgency;
  createdAt: string;
  updatedAt: string;
};

export type CreateExamInput = {
  title: string;
  examAt: string;
  classId?: string | null;
  location?: string | null;
  description?: string | null;
};

export type UpdateExamInput = {
  title?: string;
  examAt?: string;
  classId?: string | null;
  location?: string | null;
  description?: string | null;
};

export type ClassOption = {
  id: string;
  label: string;
};

export type DashboardDeadlinePreview = {
  id: string;
  title: string;
  dueLabel: string;
  tone: "danger" | "neutral";
  kind: "assignment" | "exam";
  href: "/assignments" | "/exams";
};

export type ExpenseItem = {
  id: string;
  label: string;
  category: ExpenseCategory;
  categoryLabel: string;
  spentAt: string;
  dayLabel: string;
  timeLabel: string;
  amount: number;
  amountLabel: string;
  icon: string;
  description: string | null;
  budgetId: string | null;
};

export type ExpenseDayGroup = {
  day: string;
  expenses: ExpenseItem[];
};

export type ExpenseCategoryTotal = {
  category: ExpenseCategory;
  label: string;
  icon: string;
  iconColor?: string;
  percent: number;
  amount: number;
  amountLabel: string;
  wide?: boolean;
};

export type ExpensesSnapshot = {
  items: ExpenseItem[];
  groups: ExpenseDayGroup[];
  categoryTotals: ExpenseCategoryTotal[];
};

export type LogExpenseInput = {
  label: string;
  amount: number;
  category?: ExpenseCategory;
  spentAt?: string;
  description?: string | null;
  icon?: string;
};

export type BudgetCycle = {
  id: string;
  period: BudgetPeriod;
  amount: number;
  startDate: string;
  endDate: string;
};

export type BudgetStatusTone = "healthy" | "warning" | "danger";

export type BudgetStatus = {
  budgetId: string;
  period: BudgetPeriod;
  cycleLabel: string;
  totalAmount: number;
  spentAmount: number;
  remainingAmount: number;
  totalLabel: string;
  spentLabel: string;
  remainingLabel: string;
  progressPercent: number;
  progressLabel: string;
  estimatedDaysLeft: number;
  estimateLabel: string;
  tone: BudgetStatusTone;
};

export type ChatRole = "ai" | "user";
export type ChatQuickActionKind =
  | "create_assignment"
  | "log_expense"
  | "create_class"
  | "ask_due"
  | "free_time";

export type ChatQuickAction = {
  id: string;
  label: string;
  icon: string;
  prompt: string;
  kind: ChatQuickActionKind;
};

export type ChatMessageBase = {
  id: string;
  role: ChatRole;
  createdAt: string;
  timeLabel?: string;
};

export type ChatTextMessage = ChatMessageBase & {
  kind: "text";
  text: string;
};

export type ChatAssignmentConfirmationPayload = {
  assignmentId: string;
  title: string;
  dueLabel: string;
  subjectLabel: string;
  classLinkLabel: string;
  ctaLabel: string;
  icon: string;
};

export type ChatExpenseConfirmationPayload = {
  expenseId: string;
  label: string;
  amountLabel: string;
  categoryLabel: string;
  spentAtLabel: string;
  budgetRemainingLabel: string;
  budgetTotalLabel: string;
  progressPercent: number;
  ctaLabel: string;
  icon: string;
};

export type ChatFreeTimeRecommendationItem = {
  assignmentId: string | null;
  title: string;
  dueLabel: string;
  subjectLabel: string;
  priorityLabel: string;
  icon: string;
};

export type ChatFreeTimeRecommendationPayload = {
  freeWindowLabel: string;
  nextClassLabel: string;
  recommendations: ChatFreeTimeRecommendationItem[];
  closingText: string;
};

export type ChatAssignmentConfirmationMessage = ChatMessageBase & {
  kind: "assignment_confirmation";
  payload: ChatAssignmentConfirmationPayload;
};

export type ChatExpenseConfirmationMessage = ChatMessageBase & {
  kind: "expense_confirmation";
  payload: ChatExpenseConfirmationPayload;
};

export type ChatFreeTimeRecommendationMessage = ChatMessageBase & {
  kind: "free_time_recommendation";
  payload: ChatFreeTimeRecommendationPayload;
};

export type ChatMessage =
  | ChatTextMessage
  | ChatAssignmentConfirmationMessage
  | ChatExpenseConfirmationMessage
  | ChatFreeTimeRecommendationMessage;

export type ChatState = {
  messages: ChatMessage[];
  quickActions: ChatQuickAction[];
};

export type SendChatMessageInput = {
  text: string;
  createdAt?: string;
};

export type ChatClientEffect =
  | {
      kind: "create_assignment";
      payload: CreateAssignmentInput;
    }
  | {
      kind: "create_class";
      payload: CreateClassInput;
    }
  | {
      kind: "log_expense";
      payload: LogExpenseInput;
    };

export type ChatSendResult = {
  clientEffect?: ChatClientEffect;
  userMessage: ChatTextMessage;
  responseMessage: ChatMessage;
};

export type CreateClassInput = {
  subject: string;
  dayOfWeek: DayOfWeek;
  dayIndex: number;
  startTime: string;
  endTime: string;
  room?: string | null;
  instructor?: string | null;
  color?: ScheduleColor;
};

export type UpdateClassInput = {
  color?: string | null;
  dayOfWeek?: DayOfWeek;
  endTime?: string;
  instructor?: string | null;
  isActive?: boolean;
  room?: string | null;
  startTime?: string;
  subject?: string;
};

export type OnboardingBudgetInput = {
  period: BudgetPeriod;
  amount: number;
};

export type OnboardingStarterClassInput = {
  subject: string;
  days: DayOfWeek[];
  startTime: string;
  endTime: string;
  room?: string | null;
  instructor?: string | null;
  color?: ScheduleColor;
};

export type OnboardingStarterAssignmentInput = {
  title: string;
  dueAt: string;
  classId?: string | null;
  subject?: string;
  description?: string | null;
};

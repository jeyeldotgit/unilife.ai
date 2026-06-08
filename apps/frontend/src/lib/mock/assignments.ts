import type {
  Assignment,
  AssignmentPriority,
  AssignmentReminder,
  AssignmentStatus,
  AssignmentUrgency,
  CreateAssignmentInput,
} from "@/lib/types";

const DEFAULT_CREATED_AT = "2026-06-03T08:00:00+08:00";

function formatMonthDay(isoDate: string) {
  const date = new Date(isoDate);

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function buildUrgency(status: AssignmentStatus, dueAt: string): AssignmentUrgency {
  if (status === "completed") {
    return {
      label: "COMPLETED",
      icon: "check_circle",
      bgColor: "#6cf8bb",
      textColor: "#00714d",
    };
  }

  const now = Date.now();
  const dueTime = new Date(dueAt).getTime();
  const diffMs = Math.max(dueTime - now, 0);
  const diffDays = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

  if (diffDays <= 2) {
    return {
      label: `DUE IN ${diffDays} DAY${diffDays === 1 ? "" : "S"}`,
      icon: "schedule",
      bgColor: "#ffdad6",
      textColor: "#ba1a1a",
    };
  }

  return {
    label: `DUE IN ${diffDays} DAYS`,
    icon: "event",
    bgColor: "#ffddb8",
    textColor: "#653e00",
  };
}

function buildReminders(dueAt: string): AssignmentReminder[] {
  const dueTime = new Date(dueAt).getTime();
  const windows = [
    { offset: "7d", label: "7-day reminder", hours: 24 * 7 },
    { offset: "3d", label: "3-day reminder", hours: 24 * 3 },
    { offset: "1d", label: "1-day reminder", hours: 24 },
    { offset: "3h", label: "3-hour reminder", hours: 3 },
  ] as const;

  return windows.map(({ offset, label, hours }, index) => {
    const scheduledFor = new Date(dueTime - hours * 60 * 60 * 1000).toISOString();
    const sent = index < 2;

    return {
      id: `reminder-${offset}-${Math.abs(dueTime)}`,
      label,
      offset,
      status: sent ? "sent" : "pending",
      scheduledFor,
      scheduledLabel: formatMonthDay(scheduledFor),
      sentAt: sent ? scheduledFor : null,
    };
  });
}

function createAssignmentFixture(
  assignment: Omit<Assignment, "urgency" | "reminders"> & {
    urgency?: AssignmentUrgency;
    reminders?: AssignmentReminder[];
  },
) {
  return {
    ...assignment,
    urgency:
      assignment.urgency ?? buildUrgency(assignment.status, assignment.dueAt),
    reminders: assignment.reminders ?? buildReminders(assignment.dueAt),
  } satisfies Assignment;
}

const assignments: Assignment[] = [
  createAssignmentFixture({
    id: "assignment-research-paper",
    title: "Research Paper",
    subject: "Math 101",
    classId: "class-math-mon",
    dueAt: "2026-06-05T23:59:00+08:00",
    dueDateLabel: "Jun 5",
    icon: "description",
    iconColor: "#0058be",
    status: "pending",
    priority: 3,
    description: null,
    createdAt: DEFAULT_CREATED_AT,
    updatedAt: DEFAULT_CREATED_AT,
    urgency: {
      label: "DUE IN 2 DAYS",
      icon: "schedule",
      bgColor: "#ffdad6",
      textColor: "#ba1a1a",
    },
    reminders: [
      {
        id: "reminder-research-7d",
        label: "7-day reminder",
        offset: "7d",
        status: "sent",
        scheduledFor: "2026-05-29T23:59:00+08:00",
        scheduledLabel: "May 29",
        sentAt: "2026-05-29T23:59:00+08:00",
      },
      {
        id: "reminder-research-3d",
        label: "3-day reminder",
        offset: "3d",
        status: "sent",
        scheduledFor: "2026-06-02T23:59:00+08:00",
        scheduledLabel: "Jun 2",
        sentAt: "2026-06-02T23:59:00+08:00",
      },
      {
        id: "reminder-research-1d",
        label: "1-day reminder",
        offset: "1d",
        status: "pending",
        scheduledFor: "2026-06-04T23:59:00+08:00",
        scheduledLabel: "Jun 4",
        sentAt: null,
      },
      {
        id: "reminder-research-3h",
        label: "3-hour reminder",
        offset: "3h",
        status: "pending",
        scheduledFor: "2026-06-05T20:59:00+08:00",
        scheduledLabel: "Jun 5",
        sentAt: null,
      },
    ],
  }),
  createAssignmentFixture({
    id: "assignment-book-report",
    title: "Book Report",
    subject: "No class",
    classId: null,
    dueAt: "2026-06-12T23:59:00+08:00",
    dueDateLabel: "Jun 12",
    icon: "book",
    iconColor: "#825100",
    status: "pending",
    priority: 2,
    description: null,
    createdAt: DEFAULT_CREATED_AT,
    updatedAt: DEFAULT_CREATED_AT,
    urgency: {
      label: "DUE IN 9 DAYS",
      icon: "event",
      bgColor: "#ffddb8",
      textColor: "#653e00",
    },
  }),
  createAssignmentFixture({
    id: "assignment-lab-report",
    title: "Lab Report",
    subject: "Bio 101",
    classId: null,
    dueAt: "2026-06-01T23:59:00+08:00",
    dueDateLabel: "Jun 1",
    icon: "science",
    iconColor: "#10B981",
    status: "completed",
    priority: 2,
    description: null,
    createdAt: DEFAULT_CREATED_AT,
    updatedAt: DEFAULT_CREATED_AT,
    reminders: [
      {
        id: "reminder-lab-3d",
        label: "3-day reminder",
        offset: "3d",
        status: "sent",
        scheduledFor: "2026-05-29T23:59:00+08:00",
        scheduledLabel: "May 29",
        sentAt: "2026-05-29T23:59:00+08:00",
      },
      {
        id: "reminder-lab-1d",
        label: "1-day reminder",
        offset: "1d",
        status: "sent",
        scheduledFor: "2026-05-31T23:59:00+08:00",
        scheduledLabel: "May 31",
        sentAt: "2026-05-31T23:59:00+08:00",
      },
      {
        id: "reminder-lab-3h",
        label: "3-hour reminder",
        offset: "3h",
        status: "sent",
        scheduledFor: "2026-06-01T20:59:00+08:00",
        scheduledLabel: "Jun 1",
        sentAt: "2026-06-01T20:59:00+08:00",
      },
    ],
  }),
];

export function listMockAssignments() {
  return assignments;
}

export function getMockAssignmentsByIds(ids: string[]) {
  return assignments.filter((assignment) => ids.includes(assignment.id));
}

export function appendMockAssignment(input: CreateAssignmentInput) {
  const createdAt = new Date().toISOString();
  const priority: AssignmentPriority = input.priority ?? 2;
  const status: AssignmentStatus = "pending";
  const dueDateLabel = formatMonthDay(input.dueAt);
  const subject = input.subject ?? "No class";
  const created = createAssignmentFixture({
    id: crypto.randomUUID(),
    title: input.title,
    subject,
    classId: input.classId ?? null,
    dueAt: input.dueAt,
    dueDateLabel,
    icon: input.icon ?? "assignment",
    iconColor: input.iconColor ?? "#0058be",
    status,
    priority,
    description: input.description ?? null,
    createdAt,
    updatedAt: createdAt,
  });

  assignments.unshift(created);

  return created;
}

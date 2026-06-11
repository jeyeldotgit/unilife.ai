import type { Assignment as AssignmentRecord } from "@unilife-ai/types";

import { formatMonthDay } from "@/lib/api/utils";
import type {
  Assignment,
  AssignmentPriority,
  AssignmentReminder,
  AssignmentStatus,
  AssignmentUrgency,
} from "@/lib/types";

function buildUrgency(
  status: AssignmentStatus,
  dueAt: string,
): AssignmentUrgency {
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

  return windows.map(({ offset, label, hours }) => {
    const scheduledFor = new Date(dueTime - hours * 60 * 60 * 1000).toISOString();

    return {
      id: `${offset}-${dueTime}`,
      label,
      offset,
      status: new Date(scheduledFor).getTime() <= Date.now() ? "sent" : "pending",
      scheduledFor,
      scheduledLabel: formatMonthDay(scheduledFor),
      sentAt:
        new Date(scheduledFor).getTime() <= Date.now() ? scheduledFor : null,
    };
  });
}

function inferAssignmentIcon(subject: string) {
  const normalized = subject.toLowerCase();

  if (normalized.includes("math")) {
    return { icon: "calculate", iconColor: "#0058be" };
  }

  if (normalized.includes("bio") || normalized.includes("chem")) {
    return { icon: "science", iconColor: "#10B981" };
  }

  if (normalized.includes("book") || normalized.includes("lit")) {
    return { icon: "book", iconColor: "#825100" };
  }

  return { icon: "assignment", iconColor: "#0058be" };
}

export function normalizeAssignmentRecord(
  record: AssignmentRecord,
  options?: {
    classSubjectById?: Map<string, string>;
  },
): Assignment {
  const subject =
    (record.class_id
      ? options?.classSubjectById?.get(record.class_id)
      : undefined) ?? "No class";
  const dueAt = record.due_date;
  const normalizedStatus = record.status as AssignmentStatus;
  const { icon, iconColor } = inferAssignmentIcon(subject);

  return {
    id: record.id,
    title: record.title,
    subject,
    classId: record.class_id,
    dueAt,
    dueDateLabel: formatMonthDay(dueAt),
    icon,
    iconColor,
    status: normalizedStatus,
    priority: record.priority as AssignmentPriority,
    description: record.description,
    urgency: buildUrgency(normalizedStatus, dueAt),
    reminders: buildReminders(dueAt),
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}

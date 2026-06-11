import type { Exam as ExamRecord } from "@unilife-ai/types";

import { requestBackend } from "@/lib/api/client";
import { formatMonthDay, formatMonthDayTime, formatTimeLabel } from "@/lib/api/utils";
import type {
  CreateExamInput,
  Exam,
  ExamUrgency,
  UpdateExamInput,
} from "@/lib/types";

type ListExamsResponse = {
  exams: ExamRecord[];
};

type ExamResponse = {
  exam: ExamRecord | null;
};

const DAY_MS = 24 * 60 * 60 * 1000;

function getDayStart(date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return start;
}

function getCalendarDayDiff(isoDate: string) {
  const todayStart = getDayStart(new Date());
  const targetStart = getDayStart(new Date(isoDate));

  return Math.round((targetStart.getTime() - todayStart.getTime()) / DAY_MS);
}

function buildExamUrgency(examAt: string): ExamUrgency {
  const now = Date.now();
  const examTime = new Date(examAt).getTime();

  if (examTime < now) {
    return {
      label: "FINISHED",
      icon: "history",
      bgColor: "#edeeef",
      textColor: "#424754",
      tone: "neutral",
    };
  }

  const dayDiff = getCalendarDayDiff(examAt);

  if (dayDiff <= 0) {
    return {
      label: "TODAY",
      icon: "warning",
      bgColor: "#ffdad6",
      textColor: "#ba1a1a",
      tone: "danger",
    };
  }

  if (dayDiff === 1) {
    return {
      label: "TOMORROW",
      icon: "warning",
      bgColor: "#ffdad6",
      textColor: "#ba1a1a",
      tone: "danger",
    };
  }

  if (dayDiff <= 3) {
    return {
      label: `IN ${dayDiff} DAYS`,
      icon: "schedule",
      bgColor: "#ffddb8",
      textColor: "#825100",
      tone: "warning",
    };
  }

  return {
    label: `IN ${dayDiff} DAYS`,
    icon: "event",
    bgColor: "#d8e2ff",
    textColor: "#0058be",
    tone: "neutral",
  };
}

function buildCountdownLabel(examAt: string) {
  const examTime = new Date(examAt).getTime();

  if (examTime < Date.now()) {
    return "Finished";
  }

  const dayDiff = getCalendarDayDiff(examAt);

  if (dayDiff <= 0) {
    return "Today";
  }

  if (dayDiff === 1) {
    return "Tomorrow";
  }

  return `In ${dayDiff} days`;
}

export function normalizeExamRecord(
  record: ExamRecord,
  options?: {
    classSubjectById?: Map<string, string>;
  },
): Exam {
  const subject =
    (record.class_id
      ? options?.classSubjectById?.get(record.class_id)
      : undefined) ?? "No class";

  return {
    id: record.id,
    title: record.title,
    subject,
    classId: record.class_id,
    examAt: record.exam_date,
    examDateLabel: formatMonthDay(record.exam_date),
    examTimeLabel: formatTimeLabel(record.exam_date),
    examDateTimeLabel: formatMonthDayTime(record.exam_date),
    countdownLabel: buildCountdownLabel(record.exam_date),
    location: record.location,
    description: record.description,
    urgency: buildExamUrgency(record.exam_date),
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}

export async function listExamRecords() {
  const response = await requestBackend<ListExamsResponse>("/api/exams");

  return response.exams;
}

export async function getExams(options?: {
  classSubjectById?: Map<string, string>;
}) {
  const records = await listExamRecords();

  return records.map((record) =>
    normalizeExamRecord(record, {
      classSubjectById: options?.classSubjectById,
    }),
  );
}

export async function createExam(input: CreateExamInput) {
  const timestamp = new Date().toISOString();
  const response = await requestBackend<ExamResponse>("/api/exams", {
    method: "POST",
    body: {
      id: crypto.randomUUID(),
      title: input.title,
      exam_date: input.examAt,
      class_id: input.classId ?? null,
      description: input.description ?? undefined,
      location: input.location ?? undefined,
      created_at: timestamp,
      updated_at: timestamp,
    },
  });

  if (!response.exam) {
    throw new Error("The backend did not return the created exam.");
  }

  return normalizeExamRecord(response.exam);
}

export async function updateExam(id: string, input: UpdateExamInput) {
  const response = await requestBackend<ExamResponse>(`/api/exams/${id}`, {
    method: "PATCH",
    body: {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.examAt !== undefined ? { exam_date: input.examAt } : {}),
      ...(input.classId !== undefined ? { class_id: input.classId } : {}),
      ...(input.description !== undefined
        ? { description: input.description ?? null }
        : {}),
      ...(input.location !== undefined ? { location: input.location ?? null } : {}),
      updated_at: new Date().toISOString(),
    },
  });

  return response.exam ? normalizeExamRecord(response.exam) : null;
}

export async function deleteExam(id: string) {
  const response = await requestBackend<{ ok: boolean }>(`/api/exams/${id}`, {
    method: "DELETE",
  });

  return response.ok;
}

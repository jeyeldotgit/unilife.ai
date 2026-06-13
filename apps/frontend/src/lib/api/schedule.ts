import type { ClassRecord } from "@unilife-ai/types";

import { listAssignmentRecords } from "@/lib/api/assignments";
import { requestBackend } from "@/lib/api/client";
import { buildScheduleWeekSnapshot } from "@/lib/selectors/schedule";
import type { CreateClassInput } from "@/lib/types";

export { buildScheduleWeekSnapshot };

type ListClassesResponse = {
  classes: ClassRecord[];
};

type ClassResponse = {
  class: ClassRecord | null;
};

export type UpdateClassInput = {
  color?: string | null;
  dayOfWeek?: ClassRecord["day_of_week"];
  endTime?: string;
  editScope?: "occurrence" | "future" | "series";
  instructor?: string | null;
  isActive?: boolean;
  recurrence?: ClassRecord["recurrence"];
  room?: string | null;
  startTime?: string;
  subject?: string;
};

export async function listClassRecords() {
  const response = await requestBackend<ListClassesResponse>("/api/classes");

  return response.classes.filter((record) => record.is_active);
}

export async function getClasses() {
  const [classRecords, assignmentRecords] = await Promise.all([
    listClassRecords(),
    listAssignmentRecords(),
  ]);

  return buildScheduleWeekSnapshot(classRecords, assignmentRecords);
}

export async function createClass(
  input: CreateClassInput,
) {
  const timestamp = new Date().toISOString();
  const response = await requestBackend<ClassResponse>("/api/classes", {
    method: "POST",
    body: {
      id: crypto.randomUUID(),
      subject: input.subject,
      room: input.room ?? undefined,
      instructor: input.instructor ?? undefined,
      day_of_week: input.dayOfWeek,
      start_time: input.startTime,
      end_time: input.endTime,
      color: input.color,
      recurrence: input.recurrence ?? undefined,
      created_at: timestamp,
      updated_at: timestamp,
    },
  });

  return response.class;
}

export async function updateClass(
  id: string,
  input: UpdateClassInput,
) {
  const response = await requestBackend<ClassResponse>(`/api/classes/${id}`, {
    method: "PATCH",
    body: {
      ...(input.subject !== undefined ? { subject: input.subject } : {}),
      ...(input.room !== undefined ? { room: input.room } : {}),
      ...(input.instructor !== undefined
        ? { instructor: input.instructor }
        : {}),
      ...(input.dayOfWeek !== undefined
        ? { day_of_week: input.dayOfWeek }
        : {}),
      ...(input.startTime !== undefined ? { start_time: input.startTime } : {}),
      ...(input.endTime !== undefined ? { end_time: input.endTime } : {}),
      ...(input.color !== undefined ? { color: input.color } : {}),
      ...(input.isActive !== undefined ? { is_active: input.isActive } : {}),
      ...(input.recurrence !== undefined ? { recurrence: input.recurrence } : {}),
      ...(input.editScope !== undefined ? { edit_scope: input.editScope } : {}),
      updated_at: new Date().toISOString(),
    },
  });

  return response.class;
}

export async function deleteClass(
  id: string,
) {
  const response = await requestBackend<{ ok: boolean }>(`/api/classes/${id}`, {
    method: "DELETE",
  });

  return response.ok;
}

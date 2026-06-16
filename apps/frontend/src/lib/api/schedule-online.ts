"use client";

import type { AcademicTerm, ClassRecord } from "@unilife-ai/types";

import { requestBackendClient } from "@/lib/api/client-browser";
import type { CreateClassInput, UpdateClassInput } from "@/lib/types";

type ListClassesResponse = {
  classes: ClassRecord[];
};

type ClassResponse = {
  class: ClassRecord | null;
};

type ListAcademicTermsResponse = {
  terms: AcademicTerm[];
};

type AcademicTermResponse = {
  term: AcademicTerm;
};

function getNewestActiveTerm(terms: AcademicTerm[]) {
  return (
    terms
      .filter((term) => term.status === "active" && term.deleted_at === null)
      .sort((left, right) => right.updated_at.localeCompare(left.updated_at))[0] ?? null
  );
}

export async function listClassRecordsOnline() {
  const response = await requestBackendClient<ListClassesResponse>("/api/classes");
  return response.classes.filter((record) => record.is_active && record.deleted_at === null);
}

export async function listAcademicTermsOnline() {
  const response = await requestBackendClient<ListAcademicTermsResponse>("/api/academic-terms");
  return response.terms.filter((term) => term.deleted_at === null);
}

export async function upsertAcademicTermOnline(
  input: Omit<AcademicTerm, "user_id">,
) {
  const response = await requestBackendClient<AcademicTermResponse>("/api/academic-terms", {
    method: "POST",
    body: input,
  });
  return response.term;
}

export async function getOrCreateActiveAcademicTermOnline(name = "Current Schedule") {
  const existing = getNewestActiveTerm(await listAcademicTermsOnline());
  if (existing) return existing;

  const timestamp = new Date().toISOString();
  return upsertAcademicTermOnline({
    id: crypto.randomUUID(),
    name,
    status: "active",
    created_at: timestamp,
    updated_at: timestamp,
    archived_at: null,
    deleted_at: null,
  });
}

export async function createClassOnline(input: CreateClassInput) {
  const timestamp = new Date().toISOString();
  const response = await requestBackendClient<ClassResponse>("/api/classes", {
    method: "POST",
    body: {
      id: crypto.randomUUID(),
      term_id: input.termId ?? null,
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

export async function updateClassOnline(id: string, input: UpdateClassInput) {
  const response = await requestBackendClient<ClassResponse>(`/api/classes/${id}`, {
    method: "PATCH",
    body: {
      ...(input.subject !== undefined ? { subject: input.subject } : {}),
      ...(input.termId !== undefined ? { term_id: input.termId } : {}),
      ...(input.room !== undefined ? { room: input.room } : {}),
      ...(input.instructor !== undefined ? { instructor: input.instructor } : {}),
      ...(input.dayOfWeek !== undefined ? { day_of_week: input.dayOfWeek } : {}),
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

export async function deleteClassOnline(id: string) {
  const response = await requestBackendClient<{ ok: boolean }>(`/api/classes/${id}`, {
    method: "DELETE",
  });
  return response.ok;
}

export async function archiveAcademicTermOnline(term: AcademicTerm) {
  const timestamp = new Date().toISOString();
  return upsertAcademicTermOnline({
    id: term.id,
    name: term.name,
    status: "archived",
    created_at: term.created_at,
    updated_at: timestamp,
    archived_at: timestamp,
    deleted_at: term.deleted_at,
  });
}

export async function clearAcademicTermScheduleOnline(termId: string) {
  const records = (await listClassRecordsOnline()).filter(
    (record) => record.term_id === termId,
  );
  await Promise.all(records.map((record) => deleteClassOnline(record.id)));
  return records.length;
}

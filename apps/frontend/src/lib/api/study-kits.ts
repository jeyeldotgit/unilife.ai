"use client";

import type {
  StudyCardReview,
  StudyCardReviewState,
  StudyKit,
  StudyKitDetail,
  StudyQuizAttempt,
} from "@unilife-ai/types";

import { buildBrowserBackendUrl, requestBackendClient } from "@/lib/api/client-browser";
import { createClient } from "@/lib/supabase/client";

export const MAX_STUDY_KIT_BYTES = 5 * 1024 * 1024;
export const STUDY_KIT_SOURCE_BUCKET = "study-kit-sources";

export type CreateStudyKitInput = {
  classId?: string | null;
  examId?: string | null;
  generationCount?: 5 | 10 | 20 | 30;
  sourceName: string;
  sourcePath: string;
  title?: string | null;
};

export type CreateStudyKitResponse = {
  idempotent: boolean;
  kit: StudyKitDetail;
};

export type ListStudyKitsResponse = {
  kits: StudyKit[];
};

export type StudyKitDetailResponse = {
  kit: StudyKitDetail;
};

export function validateStudyKitFile(file: File) {
  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  if (!isPdf) return "Choose a PDF reviewer.";
  if (file.size === 0) return "The selected PDF is empty.";
  if (file.size > MAX_STUDY_KIT_BYTES) return "Study reviewer PDFs must be 5 MB or smaller.";
  return null;
}

function sanitizeFileName(fileName: string) {
  const cleaned = fileName
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return cleaned.length > 0 ? cleaned : "reviewer.pdf";
}

export function buildStudyKitSourcePath(userId: string, fileName: string) {
  return `study-kits/${userId}/${Date.now()}-${crypto.randomUUID()}-${sanitizeFileName(fileName)}`;
}

export async function uploadStudyKitSource(userId: string, file: File) {
  const validation = validateStudyKitFile(file);
  if (validation) {
    throw new Error(validation);
  }

  const supabase = createClient();
  const sourcePath = buildStudyKitSourcePath(userId, file.name);
  const { error } = await supabase.storage.from(STUDY_KIT_SOURCE_BUCKET).upload(sourcePath, file, {
    cacheControl: "3600",
    contentType: "application/pdf",
    upsert: false,
  });

  if (error) {
    throw new Error(error.message);
  }

  return sourcePath;
}

export function createStudyKit(input: CreateStudyKitInput) {
  return requestBackendClient<CreateStudyKitResponse>("/api/study-kits", {
    method: "POST",
    body: {
      class_id: input.classId ?? null,
      exam_id: input.examId ?? null,
      generation_count: input.generationCount ?? 10,
      source_name: input.sourceName,
      source_path: input.sourcePath,
      title: input.title ?? null,
    },
  });
}

export function listStudyKits() {
  return requestBackendClient<ListStudyKitsResponse>("/api/study-kits");
}

export function getStudyKit(id: string) {
  return requestBackendClient<StudyKitDetailResponse>(`/api/study-kits/${id}`);
}

export function deleteStudyKit(id: string) {
  return requestBackendClient<{ deleted: boolean }>(`/api/study-kits/${id}`, {
    method: "DELETE",
  });
}

export function saveQuizAttempt(
  id: string,
  input: { answers: Record<string, string>; score: number; total: number },
) {
  return requestBackendClient<{ attempt: StudyQuizAttempt }>(
    `/api/study-kits/${id}/quiz-attempts`,
    {
      method: "POST",
      body: input,
    },
  );
}

export function saveCardReview(
  id: string,
  input: { flashcardId: string; state: StudyCardReviewState },
) {
  return requestBackendClient<{ review: StudyCardReview }>(
    `/api/study-kits/${id}/card-reviews`,
    {
      method: "POST",
      body: {
        flashcard_id: input.flashcardId,
        state: input.state,
      },
    },
  );
}

export async function downloadStudyKitExport(id: string, format: "csv" | "json") {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error("Authentication is required to download this study kit.");
  }
  const response = await fetch(buildBrowserBackendUrl(`/api/study-kits/${id}/export`, { format }), {
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (!response.ok) {
    throw new Error("The study kit export could not be downloaded.");
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `study-kit.${format}`;
  link.click();
  URL.revokeObjectURL(url);
}

"use client";

import type {
  AiProposal,
  ScheduleImportEntry,
  ScheduleImportHistory,
  ScheduleImportSourceType,
} from "@unilife-ai/types";

import { requestBackendClient } from "@/lib/api/client-browser";

export const MAX_SCHEDULE_IMPORT_BYTES = 5 * 1024 * 1024;

export type CreateScheduleImportInput = {
  contentBase64: string;
  sourceName: string;
  sourceType: ScheduleImportSourceType;
  termId?: string | null;
  timezone: string;
};

export type CreateScheduleImportResponse = {
  import: ScheduleImportHistory;
  idempotent: boolean;
};

export type ConfirmScheduleImportResponse = {
  import: ScheduleImportHistory;
  proposal: AiProposal;
};

export function getScheduleImportSourceType(file: File): ScheduleImportSourceType | null {
  const name = file.name.toLowerCase();
  if (file.type === "text/calendar" || name.endsWith(".ics")) return "ics";
  if (file.type === "application/pdf" || name.endsWith(".pdf")) return "pdf";
  if (file.type.startsWith("image/")) return "image";
  return null;
}

export function validateScheduleImportFile(file: File) {
  const sourceType = getScheduleImportSourceType(file);
  if (!sourceType) {
    return "Choose an image, PDF, or ICS schedule file.";
  }
  if (file.size > MAX_SCHEDULE_IMPORT_BYTES) {
    return "Schedule imports must be 5 MB or smaller.";
  }
  if (file.size === 0) {
    return "The selected file is empty.";
  }
  if (sourceType === "pdf") {
    return "PDF OCR is deferred. Upload an image schedule or ICS file for now.";
  }
  return null;
}

export function readFileAsBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new Error("The selected file could not be read."));
        return;
      }
      resolve(reader.result);
    };
    reader.onerror = () => reject(new Error("The selected file could not be read."));
    reader.readAsDataURL(file);
  });
}

export async function createScheduleImport(input: CreateScheduleImportInput) {
  return requestBackendClient<CreateScheduleImportResponse>("/api/schedule-imports", {
    method: "POST",
    body: {
      content_base64: input.contentBase64,
      source_name: input.sourceName,
      source_type: input.sourceType,
      term_id: input.termId ?? null,
      timezone: input.timezone,
    },
  });
}

export async function confirmScheduleImport(
  importId: string,
  entries: ScheduleImportEntry[],
) {
  return requestBackendClient<ConfirmScheduleImportResponse>(
    `/api/schedule-imports/${importId}/confirm`,
    {
      method: "POST",
      body: { entries },
    },
  );
}

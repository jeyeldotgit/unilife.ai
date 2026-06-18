import { createHash, randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AiProposal,
  AiProposedOperation,
  ScheduleImportEntry,
  ScheduleImportHistory,
  ScheduleImportProposal,
  ScheduleImportSourceType,
} from "@unilife-ai/types";

import { notFound, validationError } from "../lib/http-errors.js";
import { AcademicTermsRepository } from "../repositories/academic-terms.repository.js";
import { ScheduleImportsRepository } from "../repositories/schedule-imports.repository.js";
import {
  parseScheduleOcrText,
  SCHEDULE_OCR_PARSER_VERSION,
} from "./schedule-ocr-parser.js";
import { extractScheduleTextWithTesseract } from "./tesseract-ocr.service.js";

const MAX_SCHEDULE_IMPORT_BYTES = 5 * 1024 * 1024;
const SUPPORTED_TYPES = new Set<ScheduleImportSourceType>(["image", "pdf", "ics"]);
const DAY_BY_ICS_CODE: Record<string, string> = {
  MO: "monday",
  TU: "tuesday",
  WE: "wednesday",
  TH: "thursday",
  FR: "friday",
  SA: "saturday",
  SU: "sunday",
};

export type CreateScheduleImportInput = {
  source_type: ScheduleImportSourceType;
  source_name: string;
  timezone: string;
  content_base64: string;
  term_id?: string | null;
  source_path?: string | null;
};

export type ConfirmScheduleImportInput = {
  entries: ScheduleImportEntry[];
};

function normalizeBase64(value: string) {
  return value.includes(",") ? value.slice(value.indexOf(",") + 1) : value;
}

function decodeContent(contentBase64: string) {
  const buffer = Buffer.from(normalizeBase64(contentBase64), "base64");
  if (buffer.byteLength === 0) {
    throw validationError("The selected file is empty.");
  }
  if (buffer.byteLength > MAX_SCHEDULE_IMPORT_BYTES) {
    throw validationError("Schedule imports must be 5 MB or smaller.");
  }
  return buffer;
}

function fingerprintSource(buffer: Buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function unfoldIcsContent(text: string) {
  return text.replace(/\r?\n[ \t]/g, "");
}

function parseIcsDateTime(value: string) {
  const match = value.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})/);
  if (!match) return null;
  return {
    date: `${match[1]}-${match[2]}-${match[3]}`,
    time: `${match[4]}:${match[5]}`,
  };
}

function getIcsValue(lines: string[], key: string) {
  const line = lines.find((item) => {
    const [name] = item.split(":", 1);
    return name?.split(";")[0]?.toUpperCase() === key;
  });
  return line ? line.slice(line.indexOf(":") + 1).trim() : null;
}

function getDayFromDate(date: string, timezone: string) {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      weekday: "long",
    });
    return formatter.format(new Date(`${date}T12:00:00.000Z`)).toLowerCase();
  } catch {
    throw validationError("Choose a valid timezone before importing a schedule.");
  }
}

function parseRruleWeekdays(rrule: string | null) {
  if (!rrule) return null;
  const byDay = rrule
    .split(";")
    .find((part) => part.toUpperCase().startsWith("BYDAY="))
    ?.split("=")[1];
  if (!byDay) return null;
  return byDay
    .split(",")
    .map((code) => DAY_BY_ICS_CODE[code.trim().toUpperCase()])
    .filter(Boolean);
}

function parseIcsEntries(text: string, timezone: string) {
  const normalized = unfoldIcsContent(text);
  const eventBlocks = normalized.match(/BEGIN:VEVENT[\s\S]*?END:VEVENT/g) ?? [];

  if (eventBlocks.length === 0) {
    throw validationError("The ICS file does not contain any calendar events.");
  }

  return eventBlocks.map<ScheduleImportEntry>((block) => {
    const lines = block.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const summary = getIcsValue(lines, "SUMMARY");
    const location = getIcsValue(lines, "LOCATION");
    const dtStart = getIcsValue(lines, "DTSTART");
    const dtEnd = getIcsValue(lines, "DTEND");
    const rrule = getIcsValue(lines, "RRULE");
    const parsedStart = dtStart ? parseIcsDateTime(dtStart) : null;
    const parsedEnd = dtEnd ? parseIcsDateTime(dtEnd) : null;
    const weekdays = parseRruleWeekdays(rrule);
    const uncertainFields: string[] = [];

    if (!summary) uncertainFields.push("subject");
    if (!parsedStart) uncertainFields.push("start_time");
    if (!parsedEnd) uncertainFields.push("end_time");

    const dayOfWeek =
      weekdays?.[0] ??
      (parsedStart ? getDayFromDate(parsedStart.date, timezone) : null);
    if (!dayOfWeek) uncertainFields.push("day_of_week");

    return {
      id: randomUUID(),
      selected: uncertainFields.length === 0,
      subject: summary,
      room: location,
      instructor: null,
      recurrence:
        weekdays && parsedStart
          ? {
              rule: {
                frequency: "weekly",
                interval: 1,
                weekdays,
                timezone,
                starts_at: `${parsedStart.date}T${parsedStart.time}:00`,
                ends_at: null,
              },
            }
          : null,
      day_of_week: dayOfWeek,
      start_time: parsedStart?.time ?? null,
      end_time: parsedEnd?.time ?? null,
      confidence: uncertainFields.length === 0 ? 0.98 : 0.62,
      uncertain_fields: uncertainFields,
      duplicate_candidates: [],
      conflict_candidates: [],
    };
  });
}

function buildPdfDeferredEntry() {
  return {
    id: randomUUID(),
    selected: false,
    subject: null,
    room: null,
    instructor: null,
    recurrence: null,
    day_of_week: null,
    start_time: null,
    end_time: null,
    confidence: null,
    uncertain_fields: ["subject", "day_of_week", "start_time", "end_time"],
    duplicate_candidates: [],
    conflict_candidates: ["PDF OCR is deferred in the local Tesseract v1 importer."],
    course_code: null,
    section: null,
    source_row: null,
    parse_warnings: ["Upload an image of the schedule for v1 local OCR."],
  } satisfies ScheduleImportEntry;
}

function buildProposal(input: {
  entries: ScheduleImportEntry[];
  id: string;
  sourceFingerprint: string;
  sourceType: ScheduleImportSourceType;
  timezone: string;
  rawOcrTextPreview?: string | null;
  parserVersion?: string | null;
  termId?: string | null;
}): ScheduleImportProposal {
  return {
    id: input.id,
    source_type: input.sourceType,
    source_fingerprint: input.sourceFingerprint,
    timezone: input.timezone,
    raw_ocr_text_preview: input.rawOcrTextPreview ?? null,
    parser_version: input.parserVersion ?? null,
    term_id: input.termId ?? null,
    entries: input.entries,
    status: input.entries.some((entry) => entry.subject || entry.start_time)
      ? "ready_for_review"
      : "failed",
  };
}

function validateEntryForConfirmation(entry: ScheduleImportEntry) {
  if (!entry.selected) return null;
  if (!entry.subject || !entry.day_of_week || !entry.start_time || !entry.end_time) {
    throw validationError("Selected imported classes need subject, day, start time, and end time.");
  }
  return entry;
}

function buildAiProposal(entries: ScheduleImportEntry[], termId: string | null): AiProposal {
  const timestamp = new Date().toISOString();
  const operations: AiProposedOperation[] = entries.map((entry) => ({
    id: randomUUID(),
    operation: "create",
    entity_type: "class",
    entity_id: null,
    before: null,
    proposed: {
      subject: entry.subject,
      day_of_week: entry.day_of_week,
      start_time: entry.start_time,
      end_time: entry.end_time,
      room: entry.room,
      instructor: entry.instructor,
      recurrence: entry.recurrence,
      term_id: termId,
    },
    uncertain_fields: entry.uncertain_fields,
    confidence: entry.confidence,
    status: "proposed",
    approved_payload: null,
    applied_revision: null,
    error: null,
  }));

  return {
    id: randomUUID(),
    processing_layer: "local",
    status: "proposed",
    operations,
    created_at: timestamp,
    updated_at: timestamp,
  };
}

export class ScheduleImportsService {
  private readonly repository: ScheduleImportsRepository;
  private readonly termsRepository: AcademicTermsRepository;

  constructor(
    private readonly supabase: SupabaseClient,
    private readonly userId: string,
    repository = new ScheduleImportsRepository(supabase),
    termsRepository = new AcademicTermsRepository(supabase),
  ) {
    this.repository = repository;
    this.termsRepository = termsRepository;
  }

  async create(input: CreateScheduleImportInput) {
    if (!SUPPORTED_TYPES.has(input.source_type)) {
      throw validationError("Unsupported schedule import file type.");
    }

    const buffer = decodeContent(input.content_base64);
    const sourceFingerprint = fingerprintSource(buffer);
    const existing = await this.repository.findByFingerprintForUser(
      sourceFingerprint,
      this.userId,
    );
    if (existing) {
      return { import: existing, idempotent: true };
    }

    let entries: ScheduleImportEntry[];
    let rawOcrText: string | null = null;
    let parserVersion: string | null = null;
    let error: string | null = null;
    try {
      if (input.source_type === "ics") {
        entries = parseIcsEntries(buffer.toString("utf8"), input.timezone);
      } else if (input.source_type === "image") {
        const extractedText = await extractScheduleTextWithTesseract(buffer);
        rawOcrText = extractedText;
        parserVersion = SCHEDULE_OCR_PARSER_VERSION;
        entries = parseScheduleOcrText(extractedText);
      } else {
        entries = [buildPdfDeferredEntry()];
        error = "PDF OCR is deferred. Upload an image schedule for local OCR v1.";
      }
    } catch (parseError) {
      throw parseError instanceof Error
        ? validationError(parseError.message)
        : parseError;
    }

    const importId = randomUUID();
    const termId = await this.resolveImportTermId(input.term_id);
    const proposal = buildProposal({
      entries,
      id: importId,
      sourceFingerprint,
      sourceType: input.source_type,
      timezone: input.timezone,
      rawOcrTextPreview: rawOcrText?.slice(0, 2000) ?? null,
      parserVersion,
      termId,
    });
    const timestamp = new Date().toISOString();
    const deletedAt = error ? timestamp : null;
    const record: ScheduleImportHistory = {
      id: importId,
      user_id: this.userId,
      source_type: input.source_type,
      source_fingerprint: sourceFingerprint,
      source_name: input.source_name,
      source_path:
        input.source_path ??
        `schedule-imports/${this.userId}/${importId}/${input.source_name}`,
      source_deleted_at: deletedAt,
      extracted_text_deleted_at: deletedAt,
      timezone: input.timezone,
      raw_ocr_text_preview: rawOcrText?.slice(0, 2000) ?? null,
      parser_version: parserVersion,
      term_id: termId,
      proposal,
      ai_proposal: null,
      approved_entry_ids: [],
      status: proposal.status,
      error,
      created_at: timestamp,
      updated_at: timestamp,
      confirmed_at: null,
    };

    await this.repository.upsert(record);
    return { import: record, idempotent: false };
  }

  private async resolveImportTermId(termId: string | null | undefined) {
    if (!termId) return null;
    const term = await this.termsRepository.findByIdForUser(termId, this.userId);
    return term?.id ?? null;
  }

  async get(id: string) {
    const record = await this.repository.findByIdForUser(id, this.userId);
    if (!record) throw notFound("Schedule import not found.");
    return { import: record };
  }

  async confirm(id: string, input: ConfirmScheduleImportInput) {
    const record = await this.repository.findByIdForUser(id, this.userId);
    if (!record) throw notFound("Schedule import not found.");

    const selectedEntries = input.entries
      .map(validateEntryForConfirmation)
      .filter((entry): entry is ScheduleImportEntry => Boolean(entry));
    if (selectedEntries.length === 0) {
      throw validationError("Select at least one valid imported class to confirm.");
    }

    const aiProposal = buildAiProposal(selectedEntries, record.term_id);
    const timestamp = new Date().toISOString();
    const next: ScheduleImportHistory = {
      ...record,
      proposal: {
        ...record.proposal,
        entries: input.entries,
        status: "confirmed",
      },
      ai_proposal: aiProposal,
      approved_entry_ids: selectedEntries.map((entry) => entry.id),
      status: "confirmed",
      source_deleted_at: record.source_deleted_at ?? timestamp,
      extracted_text_deleted_at: record.extracted_text_deleted_at ?? timestamp,
      updated_at: timestamp,
      confirmed_at: timestamp,
      error: null,
    };

    await this.repository.upsert(next);
    await this.deleteSourceObject(next.source_path);
    return { import: next, proposal: aiProposal };
  }

  async deleteSource(id: string) {
    const record = await this.repository.findByIdForUser(id, this.userId);
    if (!record) throw notFound("Schedule import not found.");

    const timestamp = new Date().toISOString();
    const next: ScheduleImportHistory = {
      ...record,
      source_deleted_at: record.source_deleted_at ?? timestamp,
      extracted_text_deleted_at: record.extracted_text_deleted_at ?? timestamp,
      updated_at: timestamp,
    };
    await this.repository.upsert(next);
    await this.deleteSourceObject(next.source_path);
    return { import: next };
  }

  private async deleteSourceObject(sourcePath: string | null) {
    if (!sourcePath) return;
    try {
      await this.supabase.storage.from("schedule-imports").remove([sourcePath]);
    } catch {
      // Source deletion is best-effort after metadata records deletion intent.
    }
  }
}

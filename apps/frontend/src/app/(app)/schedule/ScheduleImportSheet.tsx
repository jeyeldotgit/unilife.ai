"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import type {
  AiProposal,
  AiProposedOperation,
  ClassRecord,
  RecurrenceReference,
  ScheduleImportEntry,
  ScheduleImportHistory,
  ScheduleImportSourceType,
} from "@unilife-ai/types";

import { Icon } from "@/components/ui/Icon";
import {
  confirmScheduleImport,
  createScheduleImport,
  getScheduleImportSourceType,
  readFileAsBase64,
  validateScheduleImportFile,
} from "@/lib/api/schedule-imports";
import {
  createClassOnline,
  getOrCreateActiveAcademicTermOnline,
} from "@/lib/api/schedule-online";
import type { DayOfWeek } from "@/lib/types";

const DAY_OPTIONS: DayOfWeek[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

function sourceDisclosure(sourceType: ScheduleImportSourceType | null) {
  if (sourceType === "ics") {
    return "ICS files are parsed deterministically before review.";
  }
  if (sourceType === "image") {
    return "Images are processed by backend-local Tesseract OCR before review.";
  }
  if (sourceType === "pdf") {
    return "PDF OCR is deferred. Use an image schedule or ICS file for now.";
  }
  return "Images, PDFs, and ICS files are supported.";
}

function hasRequiredFields(entry: ScheduleImportEntry) {
  return Boolean(entry.subject && entry.day_of_week && entry.start_time && entry.end_time);
}

function findConflictLabels(records: ClassRecord[], entry: ScheduleImportEntry) {
  if (!entry.day_of_week || !entry.start_time || !entry.end_time) return [];
  return records
    .filter(
      (record) =>
        record.deleted_at === null &&
        record.day_of_week === entry.day_of_week &&
        entry.start_time! < record.end_time &&
        record.start_time < entry.end_time!,
    )
    .map((record) => `${record.subject} ${record.start_time}-${record.end_time}`);
}

function findDuplicateLabels(records: ClassRecord[], entry: ScheduleImportEntry) {
  const subject = entry.subject?.trim().toLowerCase();
  if (!subject || !entry.day_of_week || !entry.start_time || !entry.end_time) return [];
  return records
    .filter(
      (record) =>
        record.deleted_at === null &&
        record.subject.trim().toLowerCase() === subject &&
        record.day_of_week === entry.day_of_week &&
        record.start_time === entry.start_time &&
        record.end_time === entry.end_time,
    )
    .map((record) => record.subject);
}

function updateEntry(
  entries: ScheduleImportEntry[],
  id: string,
  changes: Partial<ScheduleImportEntry>,
) {
  return entries.map((entry) => (entry.id === id ? { ...entry, ...changes } : entry));
}

async function applyScheduleImportProposalOnline(
  proposal: AiProposal,
  activeTermId: string,
) {
  const operations: AiProposedOperation[] = [];

  for (const operation of proposal.operations) {
    if (operation.status !== "approved" || operation.entity_type !== "class") {
      operations.push(operation);
      continue;
    }

    const input = operation.approved_payload ?? operation.proposed;
    const dayOfWeek = String(input.day_of_week ?? "") as DayOfWeek;
    try {
      const record = await createClassOnline({
        subject: String(input.subject ?? ""),
        termId: activeTermId,
        dayOfWeek,
        dayIndex: DAY_OPTIONS.indexOf(dayOfWeek),
        startTime: String(input.start_time ?? ""),
        endTime: String(input.end_time ?? ""),
        room: typeof input.room === "string" ? input.room : null,
        instructor: typeof input.instructor === "string" ? input.instructor : null,
        recurrence:
          typeof input.recurrence === "object" && input.recurrence !== null
            ? (input.recurrence as RecurrenceReference)
            : null,
      });
      operations.push({
        ...operation,
        entity_id: record?.id ?? operation.entity_id,
        status: "applied",
        applied_revision: record?.updated_at ?? new Date().toISOString(),
        error: null,
      });
    } catch (error) {
      operations.push({
        ...operation,
        status: "failed",
        error: error instanceof Error ? error.message : "The class could not be saved.",
      });
    }
  }

  return {
    ...proposal,
    operations,
    status: operations.some((operation) => operation.status === "failed")
      ? "failed"
      : "applied",
    updated_at: new Date().toISOString(),
  } satisfies AiProposal;
}

export function ScheduleImportSheet({
  classRecords,
  open,
  timezone,
  onApplied,
  onClose,
}: {
  classRecords: ClassRecord[];
  open: boolean;
  timezone: string;
  onApplied: () => void;
  onClose: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [importRecord, setImportRecord] = useState<ScheduleImportHistory | null>(null);
  const [entries, setEntries] = useState<ScheduleImportEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [termLabel, setTermLabel] = useState<string | null>(null);
  const [ocrStatus, setOcrStatus] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setFile(null);
      setImportRecord(null);
      setEntries([]);
      setError(null);
      setPending(false);
      setTermLabel(null);
      setOcrStatus(null);
      setSaveStatus(null);
    }
  }, [open]);

  const sourceType = file ? getScheduleImportSourceType(file) : null;
  const selectedEntries = entries.filter((entry) => entry.selected);
  const hasInvalidSelection = selectedEntries.some((entry) => !hasRequiredFields(entry));
  const canConfirm = selectedEntries.length > 0 && !hasInvalidSelection && !pending;
  const enrichedEntries = useMemo(
    () =>
      entries.map((entry) => ({
        entry,
        conflicts: [
          ...entry.conflict_candidates,
          ...findConflictLabels(classRecords, entry),
        ],
        duplicates: [
          ...entry.duplicate_candidates,
          ...findDuplicateLabels(classRecords, entry),
        ],
      })),
    [classRecords, entries],
  );

  if (!open) return null;

  const parseSelectedFile = async (selectedFile: File | null) => {
    if (!selectedFile) {
      setError("Choose a schedule file first.");
      return;
    }
    const validationError = validateScheduleImportFile(selectedFile);
    if (validationError) {
      setError(validationError);
      return;
    }
    const nextSourceType = getScheduleImportSourceType(selectedFile);
    if (!nextSourceType) return;

    setPending(true);
    setError(null);
    setOcrStatus(
      nextSourceType === "image"
        ? "Reading image and running local OCR..."
        : "Reading schedule file...",
    );
    try {
      const contentBase64 = await readFileAsBase64(selectedFile);
      const term = await getOrCreateActiveAcademicTermOnline();
      setTermLabel(term.name);
      setOcrStatus(
        nextSourceType === "image"
          ? "Tesseract is extracting schedule text..."
          : "Parsing schedule...",
      );
      const result = await createScheduleImport({
        contentBase64,
        sourceName: selectedFile.name,
        sourceType: nextSourceType,
        termId: term.id,
        timezone,
      });
      setImportRecord(result.import);
      setEntries(result.import.proposal.entries);
      if (result.import.error) setError(result.import.error);
      setOcrStatus(
        result.import.proposal.entries.length > 0
          ? "Review the parsed schedule entries below."
          : "No schedule entries were recognized.",
      );
    } catch (parseError) {
      setError(parseError instanceof Error ? parseError.message : "The import failed.");
      setOcrStatus(null);
    } finally {
      setPending(false);
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0] ?? null;
    const validationError = nextFile ? validateScheduleImportFile(nextFile) : null;
    setFile(nextFile);
    setImportRecord(null);
    setEntries([]);
    setTermLabel(null);
    setOcrStatus(null);
    setSaveStatus(null);
    setError(validationError);
    if (nextFile && !validationError) {
      void parseSelectedFile(nextFile);
    }
  };

  const handleParse = () => {
    void parseSelectedFile(file);
  };

  const handleConfirm = async () => {
    if (!importRecord || !canConfirm) return;
    const selectedCount = selectedEntries.length;
    if (
      !window.confirm(
        `Save ${selectedCount} selected ${selectedCount === 1 ? "class" : "classes"} to your active schedule?`,
      )
    ) {
      return;
    }
    setPending(true);
    setError(null);
    setSaveStatus("Saving selected classes...");
    try {
      const result = await confirmScheduleImport(importRecord.id, entries);
      const term = await getOrCreateActiveAcademicTermOnline();
      const approvedProposal = {
        ...result.proposal,
        operations: result.proposal.operations.map((operation) => ({
          ...operation,
          status: "approved" as const,
          approved_payload: {
            ...operation.proposed,
            term_id: term.id,
          },
        })),
        status: "approved" as const,
      };
      const appliedProposal = await applyScheduleImportProposalOnline(
        approvedProposal,
        term.id,
      );
      const failedOperations = appliedProposal.operations.filter(
        (operation) => operation.status === "failed",
      );
      const appliedCount = appliedProposal.operations.filter(
        (operation) => operation.status === "applied",
      ).length;

      if (appliedCount === 0) {
        setError(
          failedOperations[0]?.error ??
            "The selected classes could not be saved. Please review the fields and try again.",
        );
        setSaveStatus(null);
        return;
      }

      onApplied();
      if (failedOperations.length > 0) {
        setSaveStatus(
          `${appliedCount} ${appliedCount === 1 ? "class was" : "classes were"} saved. ${failedOperations.length} failed and can be reviewed below.`,
        );
        setEntries((currentEntries) =>
          currentEntries.map((entry) => {
            const failedOperation = failedOperations.find(
              (operation) => operation.proposed.subject === entry.subject,
            );
            return failedOperation
              ? {
                  ...entry,
                  selected: true,
                  parse_warnings: [
                    ...(entry.parse_warnings ?? []),
                    failedOperation.error ?? "This class could not be saved.",
                  ],
                }
              : { ...entry, selected: false };
          }),
        );
        return;
      }

      setSaveStatus(
        `${appliedCount} ${appliedCount === 1 ? "class" : "classes"} saved.`,
      );
      window.setTimeout(onClose, 700);
    } catch (confirmError) {
      setError(
        confirmError instanceof Error ? confirmError.message : "The import could not be confirmed.",
      );
      setSaveStatus(null);
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-[#191c1d]/35">
      <button
        type="button"
        aria-label="Close schedule import"
        className="absolute inset-0 cursor-default"
        onClick={pending ? undefined : onClose}
      />
      <div className="relative z-10 flex max-h-[92dvh] w-full flex-col rounded-t-[28px] bg-white shadow-2xl">
        <div className="shrink-0 px-5 pt-3">
          <div className="mx-auto h-1.5 w-14 rounded-full bg-[#c2c6d6]" />
          <div className="mt-5 flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#3B82F6]">
                Import Schedule
              </p>
              <h2 className="mt-1 text-2xl font-bold text-[#191c1d]">
                Review before saving
              </h2>
            </div>
            <button
              type="button"
              className="rounded-full p-2 text-[#424754] transition-colors hover:bg-[#f3f4f5]"
              onClick={onClose}
              disabled={pending}
            >
              <Icon name="close" />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-[#191c1d]">
              Schedule file
            </span>
            <input
              type="file"
              accept="image/*,application/pdf,text/calendar,.ics"
              onChange={handleFileChange}
              className="w-full rounded-xl border border-[#c2c6d6] bg-white px-4 py-3 text-sm text-[#191c1d]"
            />
          </label>

          <div className="rounded-xl border border-[#c2c6d6]/50 bg-[#f8f9fa] px-4 py-3 text-sm text-[#424754]">
            {sourceDisclosure(sourceType)}
          </div>

          {ocrStatus ? (
            <div className="flex items-center gap-2 rounded-xl border border-[#d8e2ff] bg-[#f7faff] px-4 py-3 text-sm font-medium text-[#0058be]">
              {pending ? <Icon name="progress_activity" className="animate-spin text-base" /> : null}
              {ocrStatus}
            </div>
          ) : null}

          {error ? (
            <div className="rounded-xl border border-[#ffdad6] bg-[#fff8f7] px-4 py-3 text-sm font-medium text-[#ba1a1a]">
              {error}
            </div>
          ) : null}

          {saveStatus ? (
            <div className="rounded-xl border border-[#b8e6c9] bg-[#f3fff7] px-4 py-3 text-sm font-medium text-[#006c49]">
              {saveStatus}
            </div>
          ) : null}

          {termLabel ? (
            <div className="rounded-xl border border-[#c2c6d6]/50 bg-white px-4 py-3 text-sm font-medium text-[#424754]">
              Importing into {termLabel}
            </div>
          ) : null}

          {entries.length > 0 ? (
            <div className="sticky top-0 z-10 rounded-xl border border-[#d8e2ff] bg-white p-3 shadow-md">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm font-medium text-[#424754]">
                  {selectedEntries.length} selected
                  {hasInvalidSelection ? " - fix missing required fields first" : ""}
                </div>
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={!canConfirm}
                  className="rounded-xl bg-[#3B82F6] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#3B82F6]/20 transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Save selected classes
                </button>
              </div>
            </div>
          ) : null}

          {entries.length > 0 ? (
            <div className="space-y-3">
              {enrichedEntries.map(({ entry, conflicts, duplicates }, index) => {
                const requiredMissing = entry.selected && !hasRequiredFields(entry);
                return (
                  <div
                    key={entry.id}
                    className="rounded-xl border border-[#c2c6d6]/60 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <label className="flex items-center gap-2 text-sm font-semibold text-[#191c1d]">
                        <input
                          type="checkbox"
                          checked={entry.selected}
                          onChange={(event) =>
                            setEntries(
                              updateEntry(entries, entry.id, {
                                selected: event.target.checked,
                              }),
                            )
                          }
                        />
                        {entry.course_code ?? `Entry ${index + 1}`}
                      </label>
                      <span className="text-xs font-medium text-[#6B7280]">
                        {entry.confidence === null
                          ? "Needs review"
                          : `${Math.round(entry.confidence * 100)}% confidence`}
                      </span>
                    </div>

                    {entry.section || entry.source_row ? (
                      <div className="mt-3 rounded-lg bg-[#f8f9fa] px-3 py-2 text-xs text-[#424754]">
                        {entry.section ? (
                          <p className="font-semibold">Section {entry.section}</p>
                        ) : null}
                        {entry.source_row ? (
                          <p className="mt-1 break-words">Source: {entry.source_row}</p>
                        ) : null}
                      </div>
                    ) : null}

                    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <input
                        value={entry.subject ?? ""}
                        placeholder="Subject"
                        onChange={(event) =>
                          setEntries(updateEntry(entries, entry.id, { subject: event.target.value }))
                        }
                        className="rounded-lg border border-[#c2c6d6] px-3 py-2 text-sm"
                      />
                      <select
                        value={entry.day_of_week ?? ""}
                        onChange={(event) =>
                          setEntries(
                            updateEntry(entries, entry.id, { day_of_week: event.target.value }),
                          )
                        }
                        className="rounded-lg border border-[#c2c6d6] px-3 py-2 text-sm"
                      >
                        <option value="">Day</option>
                        {DAY_OPTIONS.map((day) => (
                          <option key={day} value={day}>
                            {day}
                          </option>
                        ))}
                      </select>
                      <input
                        type="time"
                        value={entry.start_time ?? ""}
                        onChange={(event) =>
                          setEntries(
                            updateEntry(entries, entry.id, { start_time: event.target.value }),
                          )
                        }
                        className="rounded-lg border border-[#c2c6d6] px-3 py-2 text-sm"
                      />
                      <input
                        type="time"
                        value={entry.end_time ?? ""}
                        onChange={(event) =>
                          setEntries(
                            updateEntry(entries, entry.id, { end_time: event.target.value }),
                          )
                        }
                        className="rounded-lg border border-[#c2c6d6] px-3 py-2 text-sm"
                      />
                      <input
                        value={entry.room ?? ""}
                        placeholder="Room"
                        onChange={(event) =>
                          setEntries(updateEntry(entries, entry.id, { room: event.target.value }))
                        }
                        className="rounded-lg border border-[#c2c6d6] px-3 py-2 text-sm"
                      />
                      <input
                        value={entry.instructor ?? ""}
                        placeholder="Instructor"
                        onChange={(event) =>
                          setEntries(
                            updateEntry(entries, entry.id, { instructor: event.target.value }),
                          )
                        }
                        className="rounded-lg border border-[#c2c6d6] px-3 py-2 text-sm"
                      />
                    </div>

                    {entry.uncertain_fields.length > 0 ? (
                      <p className="mt-3 text-xs font-medium text-[#825100]">
                        Check: {entry.uncertain_fields.join(", ")}
                      </p>
                    ) : null}
                    {entry.parse_warnings && entry.parse_warnings.length > 0 ? (
                      <p className="mt-2 text-xs font-medium text-[#825100]">
                        Parser warning: {entry.parse_warnings.join(", ")}
                      </p>
                    ) : null}
                    {duplicates.length > 0 ? (
                      <p className="mt-2 text-xs font-medium text-[#825100]">
                        Possible duplicate: {duplicates.join(", ")}
                      </p>
                    ) : null}
                    {conflicts.length > 0 ? (
                      <p className="mt-2 text-xs font-medium text-[#825100]">
                        Conflict warning: {conflicts.join(", ")}
                      </p>
                    ) : null}
                    {requiredMissing ? (
                      <p className="mt-2 text-xs font-medium text-[#ba1a1a]">
                        Selected entries need subject, day, start time, and end time.
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-col gap-3 border-t border-[#c2c6d6]/40 bg-white px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4 sm:flex-row">
          {entries.length > 0 ? (
            <div className="flex flex-1 items-center rounded-xl border border-[#c2c6d6]/50 bg-[#f8f9fa] px-4 py-3 text-sm font-medium text-[#424754]">
              {selectedEntries.length} selected
              {hasInvalidSelection ? " - fix missing required fields first" : ""}
            </div>
          ) : null}
          <button
            type="button"
            onClick={entries.length > 0 ? handleConfirm : handleParse}
            disabled={entries.length > 0 ? !canConfirm : pending || !file || Boolean(error)}
            className="flex-1 rounded-xl bg-[#3B82F6] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#3B82F6]/20 transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending
              ? "Working..."
              : entries.length > 0
                ? `Save ${selectedEntries.length} Selected`
                : file
                  ? "Reprocess File"
                  : "Choose a File"}
          </button>
        </div>
      </div>
    </div>
  );
}

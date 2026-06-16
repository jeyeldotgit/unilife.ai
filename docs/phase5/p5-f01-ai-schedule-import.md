# P5-F01 Future AI Schedule Import

## I. Meta Specifications

**Spec Name:** P5-F01-ai-schedule-import  
**Phase:** Phase 5 Future Work  
**Responsibility:** Define the future review-first schedule-import workflow for images, PDFs, and ICS files without authorizing implementation during Phase 5.

**Implementation Status:** Future specification only. This document establishes requirements and integration boundaries but must not be treated as an active Phase 5 implementation deliverable.

**Approved Future Defaults:** Version one uses deterministic ICS parsing and backend-local Tesseract.js OCR for image schedules, validates one file per import with a 5 MB limit, defers PDF OCR, and deletes uploaded source files plus extracted text after confirmation, unrecoverable failure, or cancellation while retaining user-scoped metadata needed for idempotency and audit.

## II. System Dependencies & Architectural Context

**Required Upstream Dependencies Before Implementation:**
- `P5-S01` timezone-aware user profile.
- `P5-S02` upload errors, duplicate warnings, and recoverable mutation behavior.
- `P5-S03` recurrence, occurrence, and conflict contracts.
- `P5-S04` AI proposal review, confirmation, history, and guarded undo.
- Existing academic REST, Dexie, and sync paths.

**Inputs (Reference Materials):**
- Phase 5 implementation specs.
- Existing academic shared types and validation.
- Existing AI service and parser package.
- Existing Supabase Storage conventions.
- `docs/core/ENDPOINT_REF.md`

**Resolved Gaps:**
- Version one explicitly supports image OCR and ICS files; PDF OCR is deferred.
- Version one uses no AI for schedule import parsing. ICS is deterministic, and image text extraction uses backend-local Tesseract.js plus deterministic restructuring rules.
- Version one accepts one file per import with a 5 MB maximum.
- Version one deletes source files and extracted text after confirmation, unrecoverable failure, or cancellation.
- Semester ending is not inferred automatically; users manually archive or clear schedules.
- No imported record may write silently or bypass review.
- Parsed entries use the same recurrence, conflict, duplicate, AI proposal, mutation, and sync contracts as manually created records.
- Repeated import of the same source must be idempotent.

## III. Scope Boundaries

### A. In-Scope Elements For Future Implementation

- Upload and validation for image and ICS schedule files, with PDF OCR deferred.
- Tesseract text extraction and deterministic restructuring into proposed schedule entries.
- Confidence and uncertain-field presentation.
- Duplicate and conflict detection.
- Entry-by-entry selection, editing, rejection, and approval.
- Explicit confirmation before any persistence.
- Import history, source fingerprinting, and idempotent repeated imports.
- Manual schedule archive/clear behavior for semester-like schedule grouping.
- Privacy, retention, deletion, and failure behavior for uploaded source files and extracted text.

### B. Out-of-Scope Elements

- Any implementation work during the Phase 5 hardening release.
- Silent or automatic saving.
- University portal credential collection or scraping.
- LMS integrations.
- Guaranteed parsing of every arbitrary timetable layout.
- Importing assignments, exams, grades, or attendance from schedule files.

## IV. Technical Delivery Requirements

### A. Future Workflow

1. User chooses an image, PDF, or ICS file.
2. The client validates file type and configured size limit before upload.
3. The import service fingerprints the source and checks prior imports.
4. The source is parsed into proposed class series and occurrences.
5. The review screen displays all proposed fields, confidence, uncertainty, duplicates, and conflicts.
6. The user edits, selects, or rejects individual proposed entries.
7. Final selected entries are validated again.
8. The user explicitly confirms the final operation set.
9. Confirmed entries write through the standard local mutation and sync paths.
10. Import history records source fingerprint, proposal, approvals, results, and failures.

### B. Future Import Contract

The normalized proposal must contain:

```ts
type ScheduleImportProposal = {
  id: string;
  source_type: "image" | "pdf" | "ics";
  source_fingerprint: string;
  timezone: string;
  entries: ScheduleImportEntry[];
  status: "parsing" | "ready_for_review" | "confirmed" | "partially_applied" | "failed";
};

type ScheduleImportEntry = {
  id: string;
  selected: boolean;
  subject: string | null;
  room: string | null;
  instructor: string | null;
  recurrence: Record<string, unknown> | null;
  start_time: string | null;
  end_time: string | null;
  confidence: number | null;
  uncertain_fields: string[];
  duplicate_candidates: string[];
  conflict_candidates: string[];
};
```

The eventual implementation may refine wire shapes but must preserve the review, uncertainty, duplicate, conflict, source-fingerprint, and confirmation semantics.

### C. Parsing And Review Rules

- ICS parsing is deterministic where the source is valid; image parsing uses backend-local Tesseract.js and deterministic restructuring without AI.
- PDF OCR is deferred in version one.
- Rotated images should be normalized when possible.
- Blurry images, ambiguous times, missing AM/PM, conflicting timezone information, malformed ICS, and unrecognized layouts produce reviewable uncertainty or a recoverable failure.
- Multiple schedules or terms in one source must be separated or clearly presented for selection.
- Imported schedules attach to the active academic term; users archive or clear terms manually.
- Missing required fields remain unresolved until the user supplies them; the system must not invent values silently.
- Duplicate detection compares both existing schedule data and other entries in the same import.
- Conflicts warn without automatically blocking confirmation.
- Users may approve a subset of valid entries while leaving invalid entries unapplied.

### D. Idempotency And Persistence Rules

- Calculate a stable source fingerprint without relying only on filename.
- Re-uploading an unchanged source shows the previous import result and must not create duplicate entries.
- A changed source creates a new import revision and compares its proposals with existing imported records.
- Confirmed entries use `P5-S04` proposal confirmation and history behavior.
- Schedule persistence uses `P5-S03` recurrence and occurrence contracts through existing local mutation and sync paths.
- Partial application retries only failed operations.

### E. Privacy And Retention Rules

- Clearly disclose whether parsing is local or remote before upload.
- Uploaded sources and extracted text are user-scoped and unavailable to other users.
- Define and display a retention period before future implementation; temporary sources should be deleted as soon as no longer required.
- Users can delete retained source files and import-history content where product/legal requirements permit.
- Source files and extracted text must not be sent to AI providers or reused for model training.
- Logs must not contain full schedule source files or unnecessary extracted personal data.

## V. Validation & Exit Criteria

Before this future feature may be considered implementation-ready:

- The implementation phase, owner, storage/retention policy, and maximum file sizes are explicitly approved.
- Image, PDF, and ICS proposals all enter the same review-before-save workflow.
- No parse result can write schedule data before explicit confirmation.
- Missing or uncertain required fields cannot be silently invented.
- Repeated unchanged imports are idempotent.
- Duplicate and conflict warnings appear before confirmation.
- Partial approvals and partial failures do not replay successful operations.
- Uploaded files and extracted data follow approved user-scoped privacy and deletion rules.
- Confirmed entries integrate through Phase 5 recurrence, AI-history, mutation, and sync contracts.

## VI. Required Tests

Future implementation must include:

- File validation tests for supported, unsupported, malformed, and oversized inputs.
- Image tests for clear, blurry, rotated, low-contrast, and multi-schedule sources.
- PDF tests for text, scanned, multi-page, protected, and malformed documents.
- ICS tests for valid recurrence, timezone, exceptions, duplicates, and malformed calendar data.
- Review tests for uncertain required fields, edits, subset approval, rejection, conflicts, and duplicates.
- Idempotency tests for unchanged re-import, changed-source revision, retry, and partial application.
- Privacy and ownership tests for source access, deletion, retention cleanup, and log redaction.
- End-to-end tests proving nothing persists before explicit confirmation.

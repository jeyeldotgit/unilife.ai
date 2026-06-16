import { describe, expect, it } from "vitest";

import {
  MAX_SCHEDULE_IMPORT_BYTES,
  getScheduleImportSourceType,
  validateScheduleImportFile,
} from "@/lib/api/schedule-imports";

function createFile(name: string, type: string, size = 8) {
  return { name, size, type } as File;
}

describe("schedule import file validation", () => {
  it("accepts supported image, PDF, and ICS files", () => {
    expect(getScheduleImportSourceType(createFile("photo.png", "image/png"))).toBe("image");
    expect(getScheduleImportSourceType(createFile("schedule.pdf", "application/pdf"))).toBe("pdf");
    expect(getScheduleImportSourceType(createFile("schedule.ics", "text/calendar"))).toBe("ics");
  });

  it("rejects unsupported and oversized files", () => {
    expect(validateScheduleImportFile(createFile("notes.txt", "text/plain"))).toContain(
      "image, PDF, or ICS",
    );
    expect(
      validateScheduleImportFile(
        createFile("schedule.pdf", "application/pdf", MAX_SCHEDULE_IMPORT_BYTES + 1),
      ),
    ).toContain("5 MB");
  });

  it("defers PDF OCR in the local Tesseract v1 importer", () => {
    expect(validateScheduleImportFile(createFile("schedule.pdf", "application/pdf"))).toContain(
      "PDF OCR is deferred",
    );
  });
});

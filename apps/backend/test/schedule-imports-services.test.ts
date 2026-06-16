import { describe, expect, it, vi } from "vitest";

import type { ScheduleImportHistory } from "@unilife-ai/types";
import { ScheduleImportsService } from "../src/services/schedule-imports.service.js";

function encode(text: string) {
  return Buffer.from(text, "utf8").toString("base64");
}

function createSupabaseStub() {
  return {
    storage: {
      from: vi.fn(() => ({
        remove: vi.fn(async () => ({ error: null })),
      })),
    },
  };
}

function createRepositoryStub() {
  const records = new Map<string, ScheduleImportHistory>();
  return {
    records,
    findByFingerprintForUser: vi.fn(async (fingerprint: string, userId: string) => {
      return (
        [...records.values()].find(
          (record) =>
            record.source_fingerprint === fingerprint && record.user_id === userId,
        ) ?? null
      );
    }),
    findByIdForUser: vi.fn(async (id: string, userId: string) => {
      const record = records.get(id);
      return record?.user_id === userId ? record : null;
    }),
    upsert: vi.fn(async (record: ScheduleImportHistory) => {
      records.set(record.id, record);
    }),
  };
}

const validIcs = [
  "BEGIN:VCALENDAR",
  "BEGIN:VEVENT",
  "SUMMARY:Physics 101",
  "LOCATION:Room 204",
  "DTSTART:20260615T080000",
  "DTEND:20260615T093000",
  "RRULE:FREQ=WEEKLY;BYDAY=MO,WE",
  "END:VEVENT",
  "END:VCALENDAR",
].join("\n");

describe("ScheduleImportsService", () => {
  it("parses ICS into a review proposal without applying classes", async () => {
    const repository = createRepositoryStub();
    const service = new ScheduleImportsService(
      createSupabaseStub() as never,
      "user-1",
      repository as never,
    );

    const result = await service.create({
      content_base64: encode(validIcs),
      source_name: "schedule.ics",
      source_type: "ics",
      timezone: "Asia/Manila",
    });

    expect(result.idempotent).toBe(false);
    expect(result.import.status).toBe("ready_for_review");
    expect(result.import.proposal.entries[0]).toMatchObject({
      selected: true,
      subject: "Physics 101",
      room: "Room 204",
      day_of_week: "monday",
      start_time: "08:00",
      end_time: "09:30",
    });
    expect(result.import.ai_proposal).toBeNull();
  });

  it("returns the previous import for unchanged sources", async () => {
    const repository = createRepositoryStub();
    const service = new ScheduleImportsService(
      createSupabaseStub() as never,
      "user-1",
      repository as never,
    );

    const first = await service.create({
      content_base64: encode(validIcs),
      source_name: "schedule.ics",
      source_type: "ics",
      timezone: "Asia/Manila",
    });
    const second = await service.create({
      content_base64: encode(validIcs),
      source_name: "copy.ics",
      source_type: "ics",
      timezone: "Asia/Manila",
    });

    expect(second.idempotent).toBe(true);
    expect(second.import.id).toBe(first.import.id);
  });

  it("converts selected entries into AI proposal operations on confirm", async () => {
    const repository = createRepositoryStub();
    const service = new ScheduleImportsService(
      createSupabaseStub() as never,
      "user-1",
      repository as never,
    );
    const created = await service.create({
      content_base64: encode(validIcs),
      source_name: "schedule.ics",
      source_type: "ics",
      timezone: "Asia/Manila",
    });

    const confirmed = await service.confirm(created.import.id, {
      entries: created.import.proposal.entries,
    });

    expect(confirmed.import.status).toBe("confirmed");
    expect(confirmed.proposal.operations).toEqual([
      expect.objectContaining({
        entity_type: "class",
        operation: "create",
        proposed: expect.objectContaining({
          subject: "Physics 101",
          day_of_week: "monday",
        }),
      }),
    ]);
  });

  it("returns a recoverable PDF deferral for v1 image-first OCR", async () => {
    const repository = createRepositoryStub();
    const service = new ScheduleImportsService(
      createSupabaseStub() as never,
      "user-1",
      repository as never,
    );

    const result = await service.create({
      content_base64: encode("fake pdf bytes"),
      source_name: "schedule.pdf",
      source_type: "pdf",
      timezone: "Asia/Manila",
    });

    expect(result.import.status).toBe("failed");
    expect(result.import.error).toContain("PDF OCR is deferred");
    expect(result.import.proposal.entries[0].selected).toBe(false);
  });
});

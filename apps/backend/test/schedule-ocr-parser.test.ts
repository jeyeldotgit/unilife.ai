import { describe, expect, it } from "vitest";

import { parseScheduleOcrText } from "../src/services/schedule-ocr-parser.js";

const sample = `
# SubjectCode Description Lec Lab Unit Schedule

1 COMPO019 Applications Development and Emerging Technologies ~~ 2.0 3.0 3.0 1-BSIT 3-1- S/S 01:30PM-04:30PM/04:30PM-06:30PM
Faculty: CAYABYAB, DESIDERATA

2 COMP026 Principles of Systems Thinking 2.0 3.0 3.0 1-BSIT 3-1- T/F 04:30PM-07:30PM/04:30PM-06:30PM
Faculty: NAYRE, RACHEL

3 GEED003 The Contemporary World/Ang Kasalukuyang Daigdig 3.0 0.0 3.0 1-BSIT 3-1 -W 09:00AM-12:00PM
Faculty: DALUPANG, JOHN PAOLO

4 GEED008 Ethics/Etika 3.0 0.0 3.0 1-BSIT 3-1-T 01:30PM-04:30PM
Faculty: PANLICAN, KIER IVAN

5  HRMAO001 Principles of Organization and Management 3.0 0.0 3.0 1-BSIT 3-1-W 01:30PM-04:30PM
Faculty: JAVIER, MARIFEL

6 INTE 302 Information Assurance and Securityl 2.0 3.0 3.0 1-BSIT 3-1- T/F 10:30AM-12:30PM/10:30AM-01:30PM
Faculty: VILLAREZ, RODEL

7 INTE 303 Capstone Project 1 2.0 3.0 3.0 1-BSIT 3-1 - W/S 06:00PM-09:00PM/07:00PM-09:00PM
Faculty: BARRETTO, MONINA
`;

describe("parseScheduleOcrText", () => {
  it("parses the provided Tesseract sample into deterministic schedule entries", () => {
    const entries = parseScheduleOcrText(sample);

    expect(entries).toHaveLength(11);
    expect(new Set(entries.map((entry) => entry.course_code)).size).toBe(7);
    expect(entries[0]).toMatchObject({
      course_code: "COMPO019",
      day_of_week: "saturday",
      start_time: "13:30",
      end_time: "16:30",
      instructor: "CAYABYAB, DESIDERATA",
      section: "1-BSIT 3-1",
    });
    expect(entries[1]).toMatchObject({
      day_of_week: "saturday",
      start_time: "16:30",
      end_time: "18:30",
    });
    expect(entries.find((entry) => entry.course_code === "INTE 302")).toMatchObject({
      subject: "INTE 302 Information Assurance and Securityl",
    });
    expect(
      entries.filter((entry) => entry.course_code === "COMP026").map((entry) => entry.day_of_week),
    ).toEqual(["tuesday", "friday"]);
  });
});

import { describe, expect, it } from "vitest";

import {
  buildClassConfirmation,
  buildExamConfirmation,
} from "@/lib/chat/local-confirmations";

describe("local chat confirmations", () => {
  it("builds a class confirmation card payload", () => {
    const message = buildClassConfirmation({
      id: "class-1",
      subject: "Physics",
      dayOfWeek: "monday",
      startTime: "09:00",
      endTime: "10:30",
      room: "Lab 2",
    });

    expect(message).toMatchObject({
      kind: "class_confirmation",
      payload: {
        classId: "class-1",
        subject: "Physics",
        meetingLabel: "Monday - 09:00-10:30",
        locationLabel: "Lab 2",
      },
    });
  });

  it("builds an exam confirmation card payload", () => {
    const message = buildExamConfirmation({
      id: "exam-1",
      title: "Biology Midterm",
      subject: "Biology",
      classId: null,
      examAt: "2099-06-11T09:00:00.000Z",
      examDateLabel: "Jun 11",
      examTimeLabel: "9:00 AM",
      examDateTimeLabel: "Jun 11 9:00 AM",
      countdownLabel: "In 2 days",
      location: null,
      description: null,
      urgency: {
        label: "IN 2 DAYS",
        icon: "schedule",
        bgColor: "#ffddb8",
        textColor: "#825100",
        tone: "warning",
      },
      createdAt: "2099-06-09T00:00:00.000Z",
      updatedAt: "2099-06-09T00:00:00.000Z",
    });

    expect(message).toMatchObject({
      kind: "exam_confirmation",
      payload: {
        examId: "exam-1",
        title: "Biology Midterm",
        subjectLabel: "Biology",
        locationLabel: "No location",
      },
    });
  });
});

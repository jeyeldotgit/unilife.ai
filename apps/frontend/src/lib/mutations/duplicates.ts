import type { ClassRecord } from "@unilife-ai/types";
import type { DuplicateCandidate } from "@/lib/errors/recoverable";
import type { DayOfWeek, Exam } from "@/lib/types";

type ClassDuplicateInput = {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  subject: string;
};

export function findLikelyClassDuplicates(
  records: ClassRecord[],
  input: ClassDuplicateInput,
) {
  const normalizedSubject = input.subject.trim().toLowerCase();

  return records
    .filter(
      (record) =>
        record.deleted_at === null &&
        record.day_of_week === input.dayOfWeek &&
        record.start_time === input.startTime &&
        record.end_time === input.endTime &&
        record.subject.trim().toLowerCase() === normalizedSubject,
    )
    .map<DuplicateCandidate>((record) => ({
      id: record.id,
      label: record.subject,
      reason: `Same subject and meeting time on ${record.day_of_week}.`,
      href: `/schedule?item=${record.id}`,
    }));
}

type ExamDuplicateInput = {
  examAt: string;
  title: string;
  classId: string | null;
};

export function findLikelyExamDuplicates(records: Exam[], input: ExamDuplicateInput) {
  const normalizedTitle = input.title.trim().toLowerCase();

  return records
    .filter((record) => {
      const sameTitle =
        record.title.trim().toLowerCase() === normalizedTitle &&
        record.examAt === input.examAt;
      const sameClassWindow =
        Boolean(input.classId) &&
        record.classId === input.classId &&
        record.examAt === input.examAt;

      return sameTitle || sameClassWindow;
    })
    .map<DuplicateCandidate>((record) => ({
      id: record.id,
      label: record.title,
      reason:
        record.examAt === input.examAt
          ? "Another exam already exists at the same date and time."
          : "This looks similar to an existing exam.",
      href: `/exams?item=${record.id}`,
    }));
}

export function findLikelyProfileDuplicates() {
  return [] as DuplicateCandidate[];
}

import type { ClassRecord, Exam as ExamRecord } from "@unilife-ai/types";

import { normalizeExamRecord } from "@/lib/api/exams";
import type { ClassOption, Exam } from "@/lib/types";

export type ExamsPageData = {
  exams: Exam[];
  classOptions: ClassOption[];
  examsAvailable: boolean;
  classesAvailable: boolean;
};

export function buildExamsPageData({
  examRecords,
  classRecords,
}: {
  examRecords: ExamRecord[] | null;
  classRecords: ClassRecord[] | null;
}): ExamsPageData {
  const classSubjectById = classRecords
    ? new Map(classRecords.map((record) => [record.id, record.subject] as const))
    : undefined;

  return {
    exams:
      examRecords?.map((record) =>
        normalizeExamRecord(record, {
          classSubjectById,
        }),
      ) ?? [],
    classOptions:
      classRecords
        ?.slice()
        .sort((left, right) => left.subject.localeCompare(right.subject))
        .map((record) => ({
          id: record.id,
          label: record.subject,
        })) ?? [],
    examsAvailable: examRecords !== null,
    classesAvailable: classRecords !== null,
  };
}

import ExamsClient from "@/app/(app)/exams/ExamsClient";
import { listExamRecords } from "@/lib/api/exams";
import { listClassRecords } from "@/lib/api/schedule";

import { buildExamsPageData } from "./page-data";

export default async function ExamsPage() {
  const [examsResult, classesResult] = await Promise.allSettled([
    listExamRecords(),
    listClassRecords(),
  ]);

  const pageData = buildExamsPageData({
    examRecords: examsResult.status === "fulfilled" ? examsResult.value : null,
    classRecords: classesResult.status === "fulfilled" ? classesResult.value : null,
  });

  return <ExamsClient {...pageData} />;
}

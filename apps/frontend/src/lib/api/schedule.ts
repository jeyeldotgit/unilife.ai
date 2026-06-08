import type {
  ApiRequestOptions,
  CreateClassInput,
  LinkedAssignmentSummary,
  ScheduleClassDetail,
} from "@/lib/types";
import { listMockAssignments } from "@/lib/mock/assignments";
import {
  appendMockClass,
  getMockScheduleWeek,
} from "@/lib/mock/schedule";
import { withMockLatency } from "@/lib/api/_mock";

function toLinkedAssignmentSummary(detail: {
  id: string;
  title: string;
  dueDateLabel: string;
  status: ScheduleClassDetail["assignments"][number]["status"];
  urgencyLabel: string;
}): LinkedAssignmentSummary {
  const dueLabel =
    detail.status === "completed"
      ? "Completed"
      : detail.urgencyLabel.toLowerCase().replace(/^./, (value) => {
          return value.toUpperCase();
        });

  return {
    id: detail.id,
    title: detail.title,
    dueLabel,
    status: detail.status,
    urgencyLabel: detail.urgencyLabel,
  };
}

export function buildScheduleWeekSnapshot() {
  const scheduleWeek = getMockScheduleWeek();
  const assignments = listMockAssignments();
  const classDetails = Object.fromEntries(
    Object.entries(scheduleWeek.classDetails).map(([classId, classDetail]) => {
      const linkedAssignments = assignments
        .filter((assignment) => {
          return (
            classDetail.linkedAssignmentIds.includes(assignment.id) ||
            assignment.classId === classId
          );
        })
        .map((assignment) =>
          toLinkedAssignmentSummary({
            id: assignment.id,
            title: assignment.title,
            dueDateLabel: assignment.dueDateLabel,
            status: assignment.status,
            urgencyLabel: assignment.urgency.label,
          }),
        );

      return [
        classId,
        {
          ...classDetail,
          assignments: linkedAssignments,
        },
      ];
    }),
  ) satisfies Record<string, ScheduleClassDetail>;

  return {
    ...scheduleWeek,
    classDetails,
  };
}

export async function getClasses(options?: ApiRequestOptions) {
  return withMockLatency(() => buildScheduleWeekSnapshot(), options);
}

export async function createClass(
  input: CreateClassInput,
  options?: ApiRequestOptions,
) {
  return withMockLatency(() => appendMockClass(input), options);
}

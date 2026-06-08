import type { ApiRequestOptions, CreateAssignmentInput } from "@/lib/types";
import {
  appendMockAssignment,
  listMockAssignments,
} from "@/lib/mock/assignments";
import { withMockLatency } from "@/lib/api/_mock";

export async function getAssignments(options?: ApiRequestOptions) {
  return withMockLatency(() => listMockAssignments(), options);
}

export async function createAssignment(
  input: CreateAssignmentInput,
  options?: ApiRequestOptions,
) {
  return withMockLatency(() => appendMockAssignment(input), options);
}

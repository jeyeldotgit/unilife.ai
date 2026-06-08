import AssignmentsClient from "@/app/(app)/assignments/AssignmentsClient";
import { getAssignments } from "@/lib/api/assignments";

export default async function AssignmentsPage() {
  const assignments = await getAssignments().catch(() => null);

  return (
    <AssignmentsClient
      assignments={assignments ?? []}
      assignmentsAvailable={assignments !== null}
    />
  );
}

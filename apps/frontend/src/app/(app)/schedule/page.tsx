import ScheduleClient from "@/app/(app)/schedule/ScheduleClient";
import { getClasses } from "@/lib/api/schedule";

export default async function SchedulePage() {
  const scheduleWeek = await getClasses().catch(() => null);

  return (
    <ScheduleClient
      scheduleWeek={scheduleWeek}
      scheduleAvailable={scheduleWeek !== null}
    />
  );
}

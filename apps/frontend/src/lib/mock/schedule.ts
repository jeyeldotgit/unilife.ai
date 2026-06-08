import type {
  CreateClassInput,
  FreeWindow,
  ScheduleAgendaItem,
  ScheduleClass,
  ScheduleClassDetail,
  ScheduleDay,
  ScheduleWeek,
} from "@/lib/types";

const hours = [8, 9, 10, 11, 12, 13, 14, 15];

const days: ScheduleDay[] = [
  { dayIndex: 0, dayOfWeek: "monday", shortLabel: "Mon", dateLabel: "02" },
  { dayIndex: 1, dayOfWeek: "tuesday", shortLabel: "Tue", dateLabel: "03" },
  { dayIndex: 2, dayOfWeek: "wednesday", shortLabel: "Wed", dateLabel: "04" },
  { dayIndex: 3, dayOfWeek: "thursday", shortLabel: "Thu", dateLabel: "05" },
  { dayIndex: 4, dayOfWeek: "friday", shortLabel: "Fri", dateLabel: "06" },
];

const todayClasses: ScheduleAgendaItem[] = [
  {
    id: "agenda-math",
    subject: "Math 101",
    startTime: "08:00",
    endTime: "09:30",
    timeLabel: "08:00",
    locationLabel: "Room 3A • Building B",
  },
  {
    id: "agenda-eng-lit",
    subject: "Eng Lit",
    startTime: "10:30",
    endTime: "12:00",
    timeLabel: "10:30",
    locationLabel: "Room 12 • Library Wing",
  },
  {
    id: "agenda-pe",
    subject: "PE",
    startTime: "13:00",
    endTime: "14:30",
    timeLabel: "13:00",
    locationLabel: "Gym • Sports Complex",
  },
];

const classes: ScheduleClass[] = [
  {
    id: "class-math-mon",
    subject: "Math 101",
    dayOfWeek: "monday",
    dayIndex: 0,
    startTime: "08:00",
    endTime: "09:30",
    timeLabel: "08:00 - 09:30",
    gridHour: 8,
    label: "Math 101",
    color: "blue",
    room: "Room 3A",
    locationLabel: "Room 3A, Main Building",
    instructor: "Prof. Reyes",
    linkedAssignmentIds: ["assignment-research-paper"],
  },
  {
    id: "class-math-wed",
    subject: "Math 101",
    dayOfWeek: "wednesday",
    dayIndex: 2,
    startTime: "08:00",
    endTime: "09:30",
    timeLabel: "08:00 - 09:30",
    gridHour: 8,
    label: "Math 101",
    color: "blue",
    room: "Room 3A",
    locationLabel: "Room 3A, Main Building",
    instructor: "Prof. Reyes",
    linkedAssignmentIds: ["assignment-research-paper"],
  },
  {
    id: "class-eng-tue",
    subject: "Eng Lit",
    dayOfWeek: "tuesday",
    dayIndex: 1,
    startTime: "09:00",
    endTime: "10:30",
    timeLabel: "09:00 - 10:30",
    gridHour: 9,
    label: "Eng Lit",
    color: "amber",
    room: "Room 12",
    locationLabel: "Room 12, Library Wing",
    instructor: "Prof. Santos",
    linkedAssignmentIds: ["assignment-book-report"],
  },
  {
    id: "class-eng-thu",
    subject: "Eng Lit",
    dayOfWeek: "thursday",
    dayIndex: 3,
    startTime: "09:00",
    endTime: "10:30",
    timeLabel: "09:00 - 10:30",
    gridHour: 9,
    label: "Eng Lit",
    color: "amber",
    room: "Room 12",
    locationLabel: "Room 12, Library Wing",
    instructor: "Prof. Santos",
    linkedAssignmentIds: ["assignment-book-report"],
  },
  {
    id: "class-pe-mon",
    subject: "PE",
    dayOfWeek: "monday",
    dayIndex: 0,
    startTime: "15:00",
    endTime: "16:00",
    timeLabel: "15:00 - 16:00",
    gridHour: 15,
    label: "PE",
    color: "green",
    room: "Gym",
    locationLabel: "Gym, Sports Complex",
    instructor: "Coach Dela Cruz",
    linkedAssignmentIds: [],
  },
  {
    id: "class-pe-fri",
    subject: "PE",
    dayOfWeek: "friday",
    dayIndex: 4,
    startTime: "15:00",
    endTime: "16:00",
    timeLabel: "15:00 - 16:00",
    gridHour: 15,
    label: "PE",
    color: "green",
    room: "Gym",
    locationLabel: "Gym, Sports Complex",
    instructor: "Coach Dela Cruz",
    linkedAssignmentIds: [],
  },
];

const freeWindows: FreeWindow[] = [
  {
    id: "free-thursday-afternoon",
    dayOfWeek: "thursday",
    dayIndex: 3,
    startHour: 14,
    endHour: 16,
    startTime: "14:00",
    endTime: "16:00",
    durationMinutes: 120,
    label: "Thursday 2:00 PM - 4:00 PM",
  },
];

const classDetails: Record<string, ScheduleClassDetail> = {
  "class-math-mon": {
    ...classes[0],
    meetingLabel: "Monday & Wednesday",
    assignments: [
      {
        id: "assignment-research-paper",
        title: "Research Paper",
        dueLabel: "Due in 2 days",
        status: "pending",
        urgencyLabel: "Urgent",
      },
    ],
  },
  "class-math-wed": {
    ...classes[1],
    meetingLabel: "Monday & Wednesday",
    assignments: [
      {
        id: "assignment-research-paper",
        title: "Research Paper",
        dueLabel: "Due in 2 days",
        status: "pending",
        urgencyLabel: "Urgent",
      },
    ],
  },
  "class-eng-tue": {
    ...classes[2],
    meetingLabel: "Tuesday & Thursday",
    assignments: [
      {
        id: "assignment-book-report",
        title: "Book Report",
        dueLabel: "Due in 9 days",
        status: "pending",
        urgencyLabel: "Upcoming",
      },
    ],
  },
  "class-eng-thu": {
    ...classes[3],
    meetingLabel: "Tuesday & Thursday",
    assignments: [
      {
        id: "assignment-book-report",
        title: "Book Report",
        dueLabel: "Due in 9 days",
        status: "pending",
        urgencyLabel: "Upcoming",
      },
    ],
  },
  "class-pe-mon": {
    ...classes[4],
    meetingLabel: "Monday & Friday",
    assignments: [],
  },
  "class-pe-fri": {
    ...classes[5],
    meetingLabel: "Monday & Friday",
    assignments: [],
  },
};

export function getMockScheduleWeek(): ScheduleWeek {
  return {
    weekLabel: "Jun 2 - Jun 7",
    days,
    hours,
    classes,
    freeWindows,
    todayClasses,
    classDetails,
  };
}

export function appendMockClass(input: CreateClassInput) {
  const created: ScheduleClass = {
    id: crypto.randomUUID(),
    subject: input.subject,
    dayOfWeek: input.dayOfWeek,
    dayIndex: input.dayIndex,
    startTime: input.startTime,
    endTime: input.endTime,
    timeLabel: `${input.startTime} - ${input.endTime}`,
    gridHour: Number.parseInt(input.startTime.slice(0, 2), 10),
    label: input.subject,
    color: input.color ?? "blue",
    room: input.room ?? null,
    locationLabel: input.room ?? "No room assigned",
    instructor: input.instructor ?? null,
    linkedAssignmentIds: [],
  };

  classes.push(created);
  classDetails[created.id] = {
    ...created,
    meetingLabel: days[created.dayIndex]?.shortLabel ?? "Custom",
    assignments: [],
  };

  return created;
}

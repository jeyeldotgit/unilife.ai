export function getDeviceTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}

export function resolveProfileTimeZone(savedTimeZone: string | null | undefined) {
  return savedTimeZone ?? getDeviceTimeZone();
}

function getDateParts(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });

  const parts = formatter.formatToParts(date);
  const valueByType = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  ) as Record<string, string>;

  return {
    day: valueByType.day,
    hour: Number(valueByType.hour),
    month: valueByType.month,
    minute: Number(valueByType.minute),
    year: valueByType.year,
  };
}

export function getDateKeyInTimeZone(timeZone: string, date = new Date()) {
  const parts = getDateParts(date, timeZone);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function getTime24InTimeZone(timeZone: string, date = new Date()) {
  const parts = getDateParts(date, timeZone);
  return `${String(parts.hour).padStart(2, "0")}:${String(parts.minute).padStart(2, "0")}`;
}

export function getGreetingForTimeZone(timeZone: string, date = new Date()) {
  const hour = getDateParts(date, timeZone).hour;

  if (hour < 12) {
    return "Good morning";
  }

  if (hour < 18) {
    return "Good afternoon";
  }

  return "Good evening";
}

export function formatHeaderDate(timeZone: string, date = new Date()) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(date);
}

export function toISOString(date: Date): string {
  return date.toISOString();
}

export function nowISO(): string {
  return new Date().toISOString();
}

export function daysUntil(isoDate: string): number {
  const now = new Date();
  const target = new Date(isoDate);
  const diff = target.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
});

const relativeFormatter = new Intl.RelativeTimeFormat("en-US", {
  numeric: "auto",
});

function parseDate(value: string | Date) {
  return value instanceof Date ? value : new Date(value);
}

export function formatDateTime(value: string | Date): string {
  return dateTimeFormatter.format(parseDate(value)).replace(" at ", " · ");
}

export function formatDate(value: string | Date): string {
  return dateFormatter.format(parseDate(value));
}

export function formatTime(value: string | Date): string {
  return timeFormatter.format(parseDate(value));
}

export function formatRelative(value: string | Date, base = new Date()): string {
  const target = parseDate(value);
  const diffDays = Math.round(
    (target.getTime() - base.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (Math.abs(diffDays) <= 7) {
    return relativeFormatter.format(diffDays, "day");
  }

  return formatDate(target);
}

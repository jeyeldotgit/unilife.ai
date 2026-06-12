"use client";

import {
  useEffect,
  useState,
  useTransition,
  type FormEvent,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthenticatedPageHeader } from "@/components/profile/AuthenticatedPageHeader";
import { ClassBlock } from "@/components/ui/ClassBlock";
import { ClassDetailSheet } from "@/components/ui/ClassDetailSheet";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { useClasses } from "@/hooks/use-classes";
import { createClassLocal } from "@/lib/mutations/local-data";
import type {
  CreateClassInput,
  DayOfWeek,
  ScheduleClass,
  ScheduleClassDetail,
  ScheduleColor,
  ScheduleDay,
  ScheduleWeek,
} from "@/lib/types";
import { dismissNotification } from "@/lib/notifications/runtime";

type DayOption = Pick<ScheduleDay, "dayIndex" | "dayOfWeek" | "shortLabel" | "dateLabel">;

type AddClassFormState = {
  subject: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  room: string;
  instructor: string;
  color: ScheduleColor;
};

const FALLBACK_DAY_OPTIONS: DayOption[] = [
  { dayIndex: 0, dayOfWeek: "monday", shortLabel: "Mon", dateLabel: "02" },
  { dayIndex: 1, dayOfWeek: "tuesday", shortLabel: "Tue", dateLabel: "03" },
  { dayIndex: 2, dayOfWeek: "wednesday", shortLabel: "Wed", dateLabel: "04" },
  { dayIndex: 3, dayOfWeek: "thursday", shortLabel: "Thu", dateLabel: "05" },
  { dayIndex: 4, dayOfWeek: "friday", shortLabel: "Fri", dateLabel: "06" },
];

const COLOR_OPTIONS: Array<{
  value: ScheduleColor;
  label: string;
  accent: string;
  preview: string;
}> = [
  {
    value: "blue",
    label: "Blue",
    accent: "#0058be",
    preview: "rgba(59, 130, 246, 0.12)",
  },
  {
    value: "amber",
    label: "Amber",
    accent: "#825100",
    preview: "rgba(130, 81, 0, 0.12)",
  },
  {
    value: "green",
    label: "Green",
    accent: "#006c49",
    preview: "rgba(0, 108, 73, 0.12)",
  },
];

export interface ScheduleClientProps {
  scheduleWeek?: ScheduleWeek | null;
  scheduleAvailable?: boolean;
}

function FreeWindowInner() {
  return (
    <div className="absolute inset-1 flex items-center justify-center rounded-lg border-2 border-dashed border-[#10B981]/30 bg-[#10B981]/10">
      <span className="text-[10px] font-bold uppercase tracking-tighter text-[#10B981]">
        FREE
      </span>
    </div>
  );
}

function getInitialFormState(dayOptions: DayOption[]): AddClassFormState {
  return {
    subject: "",
    dayOfWeek: dayOptions[0]?.dayOfWeek ?? "monday",
    startTime: "08:00",
    endTime: "09:00",
    room: "",
    instructor: "",
    color: "blue",
  };
}

function toNullableString(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function AddClassSheet({
  open,
  dayOptions,
  formState,
  error,
  pending,
  onClose,
  onChange,
  onSubmit,
}: {
  open: boolean;
  dayOptions: DayOption[];
  formState: AddClassFormState;
  error: string | null;
  pending: boolean;
  onClose: () => void;
  onChange: (
    key: keyof AddClassFormState,
    value: AddClassFormState[keyof AddClassFormState],
  ) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !pending) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, open, pending]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-[#191c1d]/35">
      <button
        type="button"
        aria-label="Close add class sheet"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
        disabled={pending}
      />
      <div className="relative z-10 w-full rounded-t-[28px] bg-white px-5 pb-8 pt-3 shadow-2xl">
        <div className="mx-auto h-1.5 w-14 rounded-full bg-[#c2c6d6]" />
        <div className="mt-5 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#3B82F6]">
              Add Class
            </p>
            <h2 className="mt-1 text-2xl font-bold text-[#191c1d]">
              Create a new schedule block
            </h2>
          </div>
          <button
            type="button"
            className="rounded-full p-2 text-[#424754] transition-colors hover:bg-[#f3f4f5]"
            onClick={onClose}
            disabled={pending}
          >
            <Icon name="close" />
          </button>
        </div>

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-[#191c1d]">
              Subject
            </span>
            <input
              required
              value={formState.subject}
              onChange={(event) => onChange("subject", event.target.value)}
              className="w-full rounded-xl border border-[#c2c6d6] bg-white px-4 py-3 text-sm text-[#191c1d] outline-none transition-colors focus:border-[#3B82F6]"
              placeholder="e.g. Math 101"
            />
          </label>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-[#191c1d]">
                Day
              </span>
              <select
                value={formState.dayOfWeek}
                onChange={(event) =>
                  onChange("dayOfWeek", event.target.value as DayOfWeek)
                }
                className="w-full rounded-xl border border-[#c2c6d6] bg-white px-4 py-3 text-sm text-[#191c1d] outline-none transition-colors focus:border-[#3B82F6]"
              >
                {dayOptions.map((day) => (
                  <option key={day.dayOfWeek} value={day.dayOfWeek}>
                    {day.shortLabel} {day.dateLabel}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-[#191c1d]">
                Color
              </span>
              <div className="grid grid-cols-3 gap-2">
                {COLOR_OPTIONS.map((option) => {
                  const selected = formState.color === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => onChange("color", option.value)}
                      className="rounded-xl border px-3 py-3 text-sm font-semibold transition-transform active:scale-[0.98]"
                      style={{
                        borderColor: selected ? option.accent : "#c2c6d6",
                        backgroundColor: selected ? option.preview : "#ffffff",
                        color: option.accent,
                      }}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </label>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-[#191c1d]">
                Start time
              </span>
              <input
                required
                type="time"
                value={formState.startTime}
                onChange={(event) => onChange("startTime", event.target.value)}
                className="w-full rounded-xl border border-[#c2c6d6] bg-white px-4 py-3 text-sm text-[#191c1d] outline-none transition-colors focus:border-[#3B82F6]"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-[#191c1d]">
                End time
              </span>
              <input
                required
                type="time"
                value={formState.endTime}
                onChange={(event) => onChange("endTime", event.target.value)}
                className="w-full rounded-xl border border-[#c2c6d6] bg-white px-4 py-3 text-sm text-[#191c1d] outline-none transition-colors focus:border-[#3B82F6]"
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-[#191c1d]">
              Room
            </span>
            <input
              value={formState.room}
              onChange={(event) => onChange("room", event.target.value)}
              className="w-full rounded-xl border border-[#c2c6d6] bg-white px-4 py-3 text-sm text-[#191c1d] outline-none transition-colors focus:border-[#3B82F6]"
              placeholder="Optional room"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-[#191c1d]">
              Instructor
            </span>
            <input
              value={formState.instructor}
              onChange={(event) => onChange("instructor", event.target.value)}
              className="w-full rounded-xl border border-[#c2c6d6] bg-white px-4 py-3 text-sm text-[#191c1d] outline-none transition-colors focus:border-[#3B82F6]"
              placeholder="Optional instructor"
            />
          </label>

          {error ? (
            <div className="rounded-xl border border-[#ffdad6] bg-[#fff8f7] px-4 py-3 text-sm font-medium text-[#ba1a1a]">
              {error}
            </div>
          ) : null}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={pending}
              className="flex-1 rounded-xl border border-[#c2c6d6] px-4 py-3 text-sm font-semibold text-[#191c1d] transition-colors hover:bg-[#f3f4f5] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending}
              className="flex-1 rounded-xl bg-[#3B82F6] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#3B82F6]/20 transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending ? "Saving..." : "Save Class"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ScheduleClient({
  scheduleWeek: initialScheduleWeek,
  scheduleAvailable: initialScheduleAvailable,
}: ScheduleClientProps) {
  const classesState = useClasses();
  const router = useRouter();
  const searchParams = useSearchParams();
  const scheduleWeek = initialScheduleWeek ?? classesState.scheduleWeek;
  const scheduleAvailable = initialScheduleAvailable ?? classesState.available;
  const dayOptions =
    scheduleWeek && scheduleWeek.days.length > 0
      ? scheduleWeek.days
      : FALLBACK_DAY_OPTIONS;
  const [selectedDetail, setSelectedDetail] =
    useState<ScheduleClassDetail | null>(null);
  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [formState, setFormState] = useState<AddClassFormState>(() =>
    getInitialFormState(dayOptions),
  );
  const [isPending, startTransition] = useTransition();
  const displayedSelectedDetail = selectedDetail
    ? scheduleWeek?.classDetails[selectedDetail.id] ?? selectedDetail
    : null;

  useEffect(() => {
    const itemId = searchParams.get("item");
    if (!itemId || !scheduleWeek) return;
    if (selectedDetail?.id !== itemId) {
      // The URL is an external navigation source from the service worker.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedDetail(scheduleWeek.classDetails[itemId] ?? null);
    }
    const notificationId = searchParams.get("notification");
    if (notificationId) {
      void dismissNotification(notificationId).then(() => router.replace("/schedule"));
    }
  }, [router, scheduleWeek, searchParams, selectedDetail?.id]);

  const getClassBlock = (day: number, hour: number) => {
    return scheduleWeek?.classes.find(
      (classItem) => classItem.dayIndex === day && classItem.gridHour === hour,
    );
  };

  const isFreeWindow = (day: number, hour: number) => {
    return (
      scheduleWeek?.freeWindows.some(
        (freeWindow) =>
          freeWindow.dayIndex === day &&
          hour >= freeWindow.startHour &&
          hour < freeWindow.endHour,
      ) ?? false
    );
  };

  const handleSelectClass = (classItem: ScheduleClass) => {
    if (!scheduleWeek) {
      return;
    }

    setSelectedDetail(scheduleWeek.classDetails[classItem.id] ?? null);
  };

  const handleFormChange = (
    key: keyof AddClassFormState,
    value: AddClassFormState[keyof AddClassFormState],
  ) => {
    setFormState((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);

    const selectedDay = dayOptions.find((day) => day.dayOfWeek === formState.dayOfWeek);
    if (!selectedDay) {
      setSubmitError("Please choose a valid day.");
      return;
    }

    const payload: CreateClassInput = {
      subject: formState.subject.trim(),
      dayOfWeek: formState.dayOfWeek,
      dayIndex: selectedDay.dayIndex,
      startTime: formState.startTime,
      endTime: formState.endTime,
      room: toNullableString(formState.room),
      instructor: toNullableString(formState.instructor),
      color: formState.color,
    };

    startTransition(() => {
      void (async () => {
        try {
          await createClassLocal(payload);
        } catch (error) {
          setSubmitError(
            error instanceof Error
              ? error.message
              : "We couldn't save the class right now.",
          );
          return;
        }

        setAddSheetOpen(false);
        setSelectedDetail(null);
        setSubmitError(null);
      })();
    });
  };

  const renderScheduleContent = () => {
    if (!scheduleAvailable || !scheduleWeek) {
      return (
        <>
          <div className="rounded-xl border border-[#ffddb8] bg-[#fff8f1] px-4 py-3 text-sm font-medium text-[#825100] shadow-sm">
            We couldn&apos;t load your weekly grid right now. You can still add a
            class and refresh once the data is ready.
          </div>
          <EmptyState
            icon="calendar_month"
            title="Schedule unavailable"
            description="Your weekly schedule could not be loaded, but the page is still available and ready for new entries."
          />
        </>
      );
    }

    if (scheduleWeek.classes.length === 0) {
      return (
        <EmptyState
          icon="calendar_month"
          title="No classes scheduled yet"
          description="Your weekly grid will appear here once classes are added."
        />
      );
    }

    return (
      <div className="overflow-hidden rounded-xl border border-[#c2c6d6]/50 bg-white shadow-sm">
        <div
          className="text-center"
          style={{
            display: "grid",
            gridTemplateColumns: `60px repeat(${scheduleWeek.days.length}, 1fr)`,
            gridTemplateRows: `auto repeat(${scheduleWeek.hours.length}, 60px)`,
          }}
        >
          <div className="flex h-12 items-center justify-center border-b border-r border-[#c2c6d6]/20" />
          {scheduleWeek.days.map((day, index) => (
            <div
              key={day.dayOfWeek}
              className={`h-12 flex flex-col items-center justify-center border-b border-[#c2c6d6]/20 bg-white ${
                index < scheduleWeek.days.length - 1 ? "border-r" : ""
              }`}
            >
              <span className="text-[10px] font-medium uppercase text-[#6B7280]">
                {day.shortLabel}
              </span>
              <span className="text-sm font-semibold">{day.dateLabel}</span>
            </div>
          ))}

          {scheduleWeek.hours.map((hour, hourIndex) => {
            const isLastRow = hourIndex === scheduleWeek.hours.length - 1;

            return (
              <div key={hour} className="contents">
                <div
                  className={`flex items-start justify-center border-r border-[#c2c6d6]/10 pt-2 text-[10px] font-medium text-[#6B7280] ${
                    !isLastRow ? "border-b" : ""
                  }`}
                >
                  {`${String(hour).padStart(2, "0")}:00`}
                </div>

                {scheduleWeek.days.map((day, dayIndex) => {
                  const classBlock = getClassBlock(dayIndex, hour);
                  const free = isFreeWindow(dayIndex, hour);
                  const isLastCol = dayIndex === scheduleWeek.days.length - 1;

                  if (isLastRow) {
                    return (
                      <div
                        key={`cell-${hour}-${day.dayOfWeek}`}
                        className={`relative border-[#c2c6d6]/10 p-1 ${
                          !isLastCol ? "border-r" : ""
                        }`}
                      >
                        {classBlock ? (
                          <ClassBlock
                            classItem={classBlock}
                            onSelect={handleSelectClass}
                          />
                        ) : null}
                        {free ? <FreeWindowInner /> : null}
                      </div>
                    );
                  }

                  return (
                    <div
                      key={`cell-${hour}-${day.dayOfWeek}`}
                      className="relative border-b border-r border-[#c2c6d6]/10 p-1"
                    >
                      {classBlock ? (
                        <ClassBlock
                          classItem={classBlock}
                          onSelect={handleSelectClass}
                        />
                      ) : null}
                      {free ? <FreeWindowInner /> : null}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] pb-24 font-sans text-[#191c1d]">
      <AuthenticatedPageHeader pageTitle="Schedule" />

      <main className="mx-auto mt-4 max-w-7xl px-4 md:px-8">
        <div className="mb-6 flex flex-col gap-4">
          <h1 className="text-[28px] font-bold leading-[34px] text-[#191c1d]">
            Schedule
          </h1>

          <div className="flex items-center justify-between rounded-xl border border-[#c2c6d6]/30 bg-[#f3f4f5] p-3 shadow-sm">
            <button className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-[#edeeef]">
              <Icon name="arrow_back" className="text-[#3B82F6]" />
            </button>
            <span className="text-sm font-semibold text-[#424754]">
              {scheduleWeek?.weekLabel ?? "Schedule Preview"}
            </span>
            <button className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-[#edeeef]">
              <Icon name="arrow_forward" className="text-[#3B82F6]" />
            </button>
          </div>
        </div>

        {renderScheduleContent()}

        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={() => {
              setSelectedDetail(null);
              setFormState(getInitialFormState(dayOptions));
              setSubmitError(null);
              setAddSheetOpen(true);
            }}
            className="flex items-center gap-2 rounded-full bg-[#3B82F6] px-6 py-4 text-sm font-semibold text-white shadow-lg shadow-[#3B82F6]/20 transition-all hover:opacity-90 active:scale-95"
          >
            <Icon name="add" filled className="text-sm" />
            Add Class
          </button>
        </div>

        <div
          className="group relative mt-12 overflow-hidden rounded-xl border border-[#c2c6d6]/20 p-5 shadow-xl"
          style={{
            background: "rgba(255,255,255,0.7)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.3)",
          }}
        >
          <div className="pointer-events-none absolute -right-4 -top-4 h-24 w-24 rounded-full bg-[#10B981]/10 blur-2xl transition-transform duration-700 group-hover:scale-150" />
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#10B981]/20">
              <Icon
                name="auto_awesome"
                className="text-[#10B981]"
                filled
              />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#191c1d]">
                AI Study Insight
              </h3>
              <p className="mt-1 text-base text-[#424754]">
                Your Thursday afternoon is 100% free. Based on your upcoming
                Math exam, I recommend a 2-hour deep work session at 14:30.
              </p>
              <button className="mt-3 flex items-center gap-1 text-xs font-semibold text-[#10B981] hover:underline">
                Schedule study session
                <Icon name="arrow_forward" className="text-xs" />
              </button>
            </div>
          </div>
        </div>
      </main>

      <ClassDetailSheet
        open={displayedSelectedDetail !== null}
        detail={displayedSelectedDetail}
        onClose={() => setSelectedDetail(null)}
      />

      <AddClassSheet
        open={addSheetOpen}
        dayOptions={dayOptions}
        formState={formState}
        error={submitError}
        pending={isPending}
        onClose={() => {
          if (!isPending) {
            setAddSheetOpen(false);
            setSubmitError(null);
          }
        }}
        onChange={handleFormChange}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

"use client";

import { useEffect } from "react";
import type { ScheduleClassDetail } from "@/lib/types";
import { Icon } from "@/components/ui/Icon";
import { ReminderStatusList } from "@/components/ui/ReminderStatusList";

type ClassDetailSheetProps = {
  open: boolean;
  detail: ScheduleClassDetail | null;
  onClose: () => void;
  onEdit?: (detail: ScheduleClassDetail) => void;
  onDelete?: (detail: ScheduleClassDetail) => void;
};

export function ClassDetailSheet({
  open,
  detail,
  onClose,
  onEdit,
  onDelete,
}: ClassDetailSheetProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, open]);

  if (!open || !detail) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-[#191c1d]/35">
      <button
        type="button"
        aria-label="Close class details"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />
      <div className="relative z-10 w-full rounded-t-[28px] bg-white px-5 pb-8 pt-3 shadow-2xl">
        <div className="mx-auto h-1.5 w-14 rounded-full bg-[#c2c6d6]" />
        <div className="mt-5 flex items-start gap-3">
          <div
            className={
              detail.color === "blue"
                ? "mt-1 h-4 w-4 rounded bg-[#3B82F6]"
                : detail.color === "amber"
                  ? "mt-1 h-4 w-4 rounded bg-[#825100]"
                  : "mt-1 h-4 w-4 rounded bg-[#006c49]"
            }
          />
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-bold text-[#191c1d]">
              {detail.subject}
            </h2>
          </div>
        </div>

        <div className="mt-5 space-y-4 border-t border-[#c2c6d6]/20 pt-5">
          <div className="flex items-center gap-3 text-sm text-[#424754]">
            <Icon name="calendar_today" size={18} className="text-[#424754]" />
            <span>{detail.meetingLabel}</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-[#424754]">
            <Icon name="schedule" size={18} className="text-[#424754]" />
            <span>{detail.timeLabel}</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-[#424754]">
            <Icon name="location_on" size={18} className="text-[#424754]" />
            <span>{detail.locationLabel}</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-[#424754]">
            <Icon name="school" size={18} className="text-[#424754]" />
            <span>{detail.instructor ?? "No instructor assigned"}</span>
          </div>
        </div>

        <ReminderStatusList reminders={detail.reminders} />

        <div className="mt-6">
          <h3 className="text-sm font-semibold text-[#424754]">
            Upcoming for this class:
          </h3>
          {detail.assignments.length > 0 ? (
            <div className="mt-3 space-y-3">
              {detail.assignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className={
                    assignment.status === "pending"
                      ? "flex items-center gap-3 rounded-xl border-l-4 border-[#ba1a1a] bg-[#ffdad6]/20 px-4 py-4"
                      : assignment.status === "in_progress"
                        ? "flex items-center gap-3 rounded-xl border-l-4 border-[#825100] bg-[#ffddb8]/30 px-4 py-4"
                        : "flex items-center gap-3 rounded-xl border-l-4 border-[#10B981] bg-[#6cf8bb]/20 px-4 py-4"
                  }
                >
                  <Icon
                    name={
                      assignment.status === "completed"
                        ? "check_circle"
                        : "warning"
                    }
                    filled={assignment.status === "completed"}
                    className={
                      assignment.status === "completed"
                        ? "text-[#00714d]"
                        : "text-[#ba1a1a]"
                    }
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[#191c1d]">
                      {assignment.title}
                    </p>
                    <p className="text-xs font-medium text-[#424754]">
                      {assignment.dueLabel}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 rounded-xl border border-dashed border-[#c2c6d6]/30 bg-[#f8f9fa] px-4 py-4 text-sm font-medium text-[#6B7280]">
              No upcoming assignments linked yet.
            </p>
          )}
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={() => onEdit?.(detail)}
            className="flex-1 rounded-xl border border-[#c2c6d6] px-4 py-3 text-sm font-semibold text-[#191c1d] transition-colors hover:bg-[#f3f4f5]"
          >
            <span className="flex items-center justify-center gap-2">
              <Icon name="edit" size={18} />
              Edit
            </span>
          </button>
          <button
            type="button"
            onClick={() => onDelete?.(detail)}
            className="flex-1 rounded-xl border border-[#ffdad6] bg-[#fff8f7] px-4 py-3 text-sm font-semibold text-[#ba1a1a] transition-colors hover:bg-[#ffefed]"
          >
            <span className="flex items-center justify-center gap-2">
              <Icon name="delete" size={18} />
              Delete
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

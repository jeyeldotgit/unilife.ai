"use client";

import { useEffect } from "react";
import { Icon } from "@/components/ui/Icon";
import type { Exam } from "@/lib/types";

export function ExamDetailSheet({
  open,
  exam,
  pending,
  onClose,
  onEdit,
  onDelete,
}: {
  open: boolean;
  exam: Exam | null;
  pending: boolean;
  onClose: () => void;
  onEdit: (exam: Exam) => void;
  onDelete: (exam: Exam) => void;
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

  if (!open || !exam) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-[#191c1d]/35">
      <button
        type="button"
        aria-label="Close exam details"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
        disabled={pending}
      />
      <div className="relative z-10 w-full rounded-t-[28px] bg-white px-5 pb-8 pt-3 shadow-2xl">
        <div className="mx-auto h-1.5 w-14 rounded-full bg-[#c2c6d6]" />
        <div className="mt-5 flex items-start gap-3">
          <div className="mt-1 flex h-11 w-11 items-center justify-center rounded-full bg-[#d8e2ff] text-[#0058be]">
            <Icon name="quiz" filled={exam.urgency.tone === "danger"} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-bold text-[#191c1d]">{exam.title}</h2>
            <p className="mt-1 text-sm font-medium text-[#424754]">
              {exam.subject}
            </p>
          </div>
          <div
            className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em]"
            style={{
              backgroundColor: exam.urgency.bgColor,
              color: exam.urgency.textColor,
            }}
          >
            <Icon name={exam.urgency.icon} size={14} />
            {exam.urgency.label}
          </div>
        </div>

        <div className="mt-5 space-y-4 border-t border-[#c2c6d6]/20 pt-5">
          <div className="flex items-center gap-3 text-sm text-[#424754]">
            <Icon name="calendar_today" size={18} className="text-[#424754]" />
            <span>{exam.examDateTimeLabel}</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-[#424754]">
            <Icon name="event_upcoming" size={18} className="text-[#424754]" />
            <span>{exam.countdownLabel}</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-[#424754]">
            <Icon name="location_on" size={18} className="text-[#424754]" />
            <span>{exam.location ?? "No location added"}</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-[#424754]">
            <Icon name="description" size={18} className="text-[#424754]" />
            <span>{exam.description ?? "No description added"}</span>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={() => onEdit(exam)}
            disabled={pending}
            className="flex-1 rounded-xl border border-[#c2c6d6] px-4 py-3 text-sm font-semibold text-[#191c1d] transition-colors hover:bg-[#f3f4f5] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="flex items-center justify-center gap-2">
              <Icon name="edit" size={18} />
              Edit
            </span>
          </button>
          <button
            type="button"
            onClick={() => onDelete(exam)}
            disabled={pending}
            className="flex-1 rounded-xl border border-[#ffdad6] bg-[#fff8f7] px-4 py-3 text-sm font-semibold text-[#ba1a1a] transition-colors hover:bg-[#ffefed] disabled:cursor-not-allowed disabled:opacity-60"
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

"use client";

import { useEffect } from "react";

import { Icon } from "@/components/ui/Icon";
import { ReminderStatusList } from "@/components/ui/ReminderStatusList";
import type { Assignment } from "@/lib/types";

export function AssignmentDetailSheet({
  assignment,
  onClose,
}: {
  assignment: Assignment | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!assignment) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [assignment, onClose]);

  if (!assignment) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-[#191c1d]/35">
      <button
        type="button"
        aria-label="Close assignment details"
        className="absolute inset-0"
        onClick={onClose}
      />
      <div className="relative z-10 max-h-[90dvh] w-full overflow-y-auto rounded-t-[28px] bg-white px-5 pb-8 pt-3 shadow-2xl">
        <div className="mx-auto h-1.5 w-14 rounded-full bg-[#c2c6d6]" />
        <div className="mt-5 flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#d8e2ff] text-[#0058be]">
            <Icon name={assignment.icon} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-bold text-[#191c1d]">
              {assignment.title}
            </h2>
            <p className="mt-1 text-sm font-medium text-[#424754]">
              {assignment.subject}
            </p>
          </div>
        </div>
        <div className="mt-5 space-y-4 border-t border-[#c2c6d6]/20 pt-5">
          <div className="flex items-center gap-3 text-sm text-[#424754]">
            <Icon name="calendar_today" size={18} />
            <span>Due {assignment.dueDateLabel}</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-[#424754]">
            <Icon name="description" size={18} />
            <span>{assignment.description ?? "No description added"}</span>
          </div>
        </div>
        <ReminderStatusList reminders={assignment.reminders} />
      </div>
    </div>
  );
}


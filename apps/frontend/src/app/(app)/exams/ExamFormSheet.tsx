"use client";

import { useEffect, type FormEvent } from "react";
import { Icon } from "@/components/ui/Icon";
import { toDateTimeLocalValue } from "@/lib/api/utils";
import type { ClassOption, Exam } from "@/lib/types";

export type ExamFormState = {
  title: string;
  examAt: string;
  classId: string;
  location: string;
  description: string;
};

export function createEmptyExamFormState(): ExamFormState {
  return {
    title: "",
    examAt: "",
    classId: "",
    location: "",
    description: "",
  };
}

export function createExamFormStateFromExam(exam: Exam): ExamFormState {
  return {
    title: exam.title,
    examAt: toDateTimeLocalValue(exam.examAt),
    classId: exam.classId ?? "",
    location: exam.location ?? "",
    description: exam.description ?? "",
  };
}

export function ExamFormSheet({
  open,
  mode,
  classOptions,
  classesAvailable,
  formState,
  error,
  pending,
  onClose,
  onChange,
  onSubmit,
}: {
  open: boolean;
  mode: "create" | "edit";
  classOptions: ClassOption[];
  classesAvailable: boolean;
  formState: ExamFormState;
  error: string | null;
  pending: boolean;
  onClose: () => void;
  onChange: (
    key: keyof ExamFormState,
    value: ExamFormState[keyof ExamFormState],
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
        aria-label="Close exam form"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
        disabled={pending}
      />
      <div className="relative z-10 w-full rounded-t-[28px] bg-white px-5 pb-8 pt-3 shadow-2xl">
        <div className="mx-auto h-1.5 w-14 rounded-full bg-[#c2c6d6]" />
        <div className="mt-5 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#3B82F6]">
              {mode === "create" ? "Add Exam" : "Edit Exam"}
            </p>
            <h2 className="mt-1 text-2xl font-bold text-[#191c1d]">
              {mode === "create"
                ? "Create a new exam deadline"
                : "Update exam details"}
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
              Title
            </span>
            <input
              required
              value={formState.title}
              onChange={(event) => onChange("title", event.target.value)}
              className="w-full rounded-xl border border-[#c2c6d6] bg-white px-4 py-3 text-sm text-[#191c1d] outline-none transition-colors focus:border-[#3B82F6]"
              placeholder="e.g. Midterm in Calculus"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-[#191c1d]">
              Date and time
            </span>
            <input
              required
              type="datetime-local"
              value={formState.examAt}
              onChange={(event) => onChange("examAt", event.target.value)}
              className="w-full rounded-xl border border-[#c2c6d6] bg-white px-4 py-3 text-sm text-[#191c1d] outline-none transition-colors focus:border-[#3B82F6]"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-[#191c1d]">
              Linked class
            </span>
            <select
              value={formState.classId}
              onChange={(event) => onChange("classId", event.target.value)}
              className="w-full rounded-xl border border-[#c2c6d6] bg-white px-4 py-3 text-sm text-[#191c1d] outline-none transition-colors focus:border-[#3B82F6]"
            >
              <option value="">No class linked</option>
              {classOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
            {!classesAvailable ? (
              <p className="mt-2 text-xs font-medium text-[#825100]">
                Class options are unavailable right now. You can still save this
                exam without linking a class.
              </p>
            ) : null}
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-[#191c1d]">
              Location
            </span>
            <input
              value={formState.location}
              onChange={(event) => onChange("location", event.target.value)}
              className="w-full rounded-xl border border-[#c2c6d6] bg-white px-4 py-3 text-sm text-[#191c1d] outline-none transition-colors focus:border-[#3B82F6]"
              placeholder="Optional room or venue"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-[#191c1d]">
              Description
            </span>
            <textarea
              value={formState.description}
              onChange={(event) => onChange("description", event.target.value)}
              className="min-h-28 w-full rounded-xl border border-[#c2c6d6] bg-white px-4 py-3 text-sm text-[#191c1d] outline-none transition-colors focus:border-[#3B82F6]"
              placeholder="Optional notes, scope, or reminders"
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
              {pending
                ? mode === "create"
                  ? "Saving..."
                  : "Updating..."
                : mode === "create"
                  ? "Save Exam"
                  : "Update Exam"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

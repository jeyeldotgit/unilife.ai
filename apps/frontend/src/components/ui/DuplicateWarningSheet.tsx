"use client";

import { useEffect, useRef } from "react";
import { Icon } from "@/components/ui/Icon";
import type { DuplicateCandidate } from "@/lib/errors/recoverable";

export function DuplicateWarningSheet({
  open,
  pending = false,
  candidates,
  onCancel,
  onConfirm,
  onReview,
}: {
  open: boolean;
  pending?: boolean;
  candidates: DuplicateCandidate[];
  onCancel: () => void;
  onConfirm: () => void;
  onReview: (candidate: DuplicateCandidate) => void;
}) {
  const cancelRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    cancelRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !pending) {
        onCancel();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onCancel, open, pending]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-end bg-[#191c1d]/40">
      <button
        type="button"
        aria-label="Close duplicate warning"
        className="absolute inset-0"
        disabled={pending}
        onClick={onCancel}
      />
      <div className="relative z-10 w-full rounded-t-[28px] bg-white px-5 pb-8 pt-3 shadow-2xl">
        <div className="mx-auto h-1.5 w-14 rounded-full bg-[#c2c6d6]" />
        <div className="mt-5 flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#fff8f1] text-[#825100]">
            <Icon name="warning" filled />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-bold text-[#191c1d]">
              This looks similar to an existing record
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#424754]">
              Review the possible match below, or continue if you intend to save a
              separate record.
            </p>
          </div>
        </div>
        <div className="mt-6 space-y-3">
          {candidates.map((candidate) => (
            <div
              key={candidate.id}
              className="rounded-2xl border border-[#c2c6d6]/40 bg-[#f8f9fa] px-4 py-4"
            >
              <p className="text-sm font-semibold text-[#191c1d]">{candidate.label}</p>
              <p className="mt-1 text-sm font-medium text-[#424754]">
                {candidate.reason}
              </p>
              <button
                type="button"
                className="mt-3 text-sm font-semibold text-[#0058be]"
                onClick={() => onReview(candidate)}
              >
                Review existing
              </button>
            </div>
          ))}
        </div>
        <div className="mt-6 flex gap-3">
          <button
            ref={cancelRef}
            type="button"
            className="flex-1 rounded-xl border border-[#c2c6d6] px-4 py-3 text-sm font-semibold text-[#191c1d]"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={pending}
            className="flex-1 rounded-xl bg-[#0058be] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
            onClick={onConfirm}
          >
            {pending ? "Saving..." : "Save anyway"}
          </button>
        </div>
      </div>
    </div>
  );
}

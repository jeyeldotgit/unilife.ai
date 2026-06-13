"use client";

import { useEffect, useRef } from "react";
import { Icon } from "@/components/ui/Icon";

type FormErrorSummaryProps = {
  formId?: string;
  fieldErrors?: Record<string, string[]>;
  message?: string | null;
};

export function FormErrorSummary({
  formId,
  fieldErrors,
  message,
}: FormErrorSummaryProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const entries = Object.entries(fieldErrors ?? {});

  useEffect(() => {
    if (entries.length === 0 && !message) {
      return;
    }

    ref.current?.focus();
  }, [entries.length, message]);

  if (entries.length === 0 && !message) {
    return null;
  }

  return (
    <div
      ref={ref}
      tabIndex={-1}
      className="rounded-xl border border-[#ffdad6] bg-[#fff8f7] px-4 py-3 text-sm text-[#ba1a1a]"
      role="alert"
    >
      <div className="flex items-start gap-3">
        <Icon name="error" filled size={18} className="mt-0.5" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold">Please review the highlighted fields.</p>
          {message ? <p className="mt-1 font-medium">{message}</p> : null}
          {entries.length > 0 ? (
            <ul className="mt-2 list-disc pl-5">
              {entries.map(([field, errors]) => (
                <li key={field}>
                  <a href={formId ? `#${formId}-${field}` : `#${field}`}>
                    {errors[0]}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function FieldErrorMessage({
  field,
  error,
  formId,
}: {
  field: string;
  error: string | null;
  formId?: string;
}) {
  if (!error) {
    return null;
  }

  return (
    <p
      id={formId ? `${formId}-${field}-error` : `${field}-error`}
      className="mt-2 text-xs font-medium text-[#ba1a1a]"
    >
      {error}
    </p>
  );
}

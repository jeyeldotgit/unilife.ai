"use client";

import { useState } from "react";

interface EmailFieldProps {
  defaultValue?: string;
  label?: string;
  placeholder?: string;
  autoComplete?: string;
  validationMode?: "none" | "basic" | "academic";
  successMessage?: string;
}

export default function EmailField({
  defaultValue = "",
  label = "Email Address",
  placeholder = "Enter your email",
  autoComplete = "email",
  validationMode = "basic",
  successMessage,
}: EmailFieldProps) {
  const [email, setEmail] = useState(defaultValue);

  const hasValue = email.trim().length > 0;
  const matchesEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isAcademicEmail = email.toLowerCase().includes(".edu");
  const isValid =
    validationMode === "none"
      ? false
      : matchesEmail && (validationMode !== "academic" || isAcademicEmail);

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-semibold text-[#191c1d]" htmlFor="email">
        {label}
      </label>
      <div className="relative">
        <input
          id="email"
          name="email"
          type="email"
          required
          value={email}
          placeholder={placeholder}
          autoComplete={autoComplete}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl px-4 py-3 text-base text-[#191c1d] outline-none transition-all"
          style={{
            backgroundColor: "#ffffff",
            border: `1px solid ${isValid ? "#10B981" : "#c2c6d6"}`,
            boxShadow: isValid ? "0 0 0 1px #10B981" : "none",
          }}
          onFocus={(e) => {
            if (!isValid) {
              e.currentTarget.style.border = "1px solid #3B82F6";
              e.currentTarget.style.boxShadow = "0 0 0 1px #3B82F6";
            }
          }}
          onBlur={(e) => {
            e.currentTarget.style.border = `1px solid ${isValid ? "#10B981" : "#c2c6d6"}`;
            e.currentTarget.style.boxShadow = isValid
              ? "0 0 0 1px #10B981"
              : "none";
          }}
        />
        {isValid && (
          <div
            className="absolute top-1/2 right-4 flex -translate-y-1/2 items-center"
            style={{ color: "#10B981" }}
          >
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: 20,
                fontVariationSettings: "'FILL' 1",
              }}
            >
              check_circle
            </span>
          </div>
        )}
      </div>
      {hasValue && isValid && successMessage ? (
        <p
          className="flex items-center gap-1 text-xs font-medium"
          style={{ color: "#10B981" }}
        >
          {successMessage}
        </p>
      ) : null}
    </div>
  );
}

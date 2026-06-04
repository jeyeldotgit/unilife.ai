"use client";

import { useState } from "react";

interface PasswordFieldProps {
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  minLength?: number;
  placeholder?: string;
  id?: string;
  name?: string;
}

const PasswordField = ({
  value,
  onChange,
  autoComplete = "current-password",
  minLength,
  placeholder = "Enter your password",
  id = "password",
  name = "password",
}: PasswordFieldProps) => {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        id={id}
        name={name}
        type={visible ? "text" : "password"}
        required
        minLength={minLength}
        placeholder={placeholder}
        value={value}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl px-4 py-3 pr-12 text-base text-[#191c1d] outline-none transition-all"
        style={{ backgroundColor: "#ffffff", border: "1px solid #c2c6d6" }}
        onFocus={(e) => {
          e.currentTarget.style.border = "1px solid #3B82F6";
          e.currentTarget.style.boxShadow = "0 0 0 1px #3B82F6";
        }}
        onBlur={(e) => {
          e.currentTarget.style.border = "1px solid #c2c6d6";
          e.currentTarget.style.boxShadow = "none";
        }}
      />
      <button
        type="button"
        onClick={() => setVisible((currentVisible) => !currentVisible)}
        className="absolute top-1/2 right-4 -translate-y-1/2 text-[#424754] transition-colors hover:text-[#191c1d]"
      >
        <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
          {visible ? "visibility_off" : "visibility"}
        </span>
      </button>
    </div>
  );
};

export default PasswordField;

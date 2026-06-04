"use client";

import { useState } from "react";
import { useActionState } from "react";

import { AuthDivider } from "@/app/(auth)/components/AuthDivider";
import { AuthSocialButtons } from "@/app/(auth)/components/AuthSocialButtons";
import EmailField from "@/app/(auth)/components/EmailField";
import PasswordField from "@/app/(auth)/components/PasswordField";
import PasswordStrengthBar from "@/app/(auth)/components/PasswordStrengthBar";
import { register, type RegisterState } from "../actions";

const initialState: RegisterState = {
  error: null,
  submitted: false,
};

const RegistrationForm = () => {
  // Local state for password — lives in the client, not the server action
  const [password, setPassword] = useState("");
  const [state, formAction, isPending] = useActionState(register, initialState);

  return (
    <div
      className="border p-5 rounded-xl shadow-sm"
      style={{
        background: "rgba(255,255,255,0.7)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderColor: "#c2c6d6",
      }}
    >
      <form className="flex flex-col gap-5" action={formAction}>
        {/* Display Name */}
        <div className="flex flex-col gap-2">
          <label
            className="text-sm font-semibold text-[#191c1d]"
            htmlFor="display-name"
          >
            Display Name
          </label>
          <input
            id="display-name"
            name="displayName"
            type="text"
            required
            placeholder="e.g., Maria Santos"
            className="w-full rounded-xl px-4 py-3 outline-none text-base text-[#191c1d] transition-all"
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
        </div>

        {/* Email */}
        <EmailField
          defaultValue="maria.santos@university.edu"
          validationMode="academic"
          successMessage="Perfect! This looks like a valid academic email."
        />

        {/* Password — controlled locally so PasswordStrengthBar can read it,
            but the hidden input ensures the value is included in the FormData */}
        <div className="flex flex-col gap-2">
          <label
            className="text-sm font-semibold text-[#191c1d]"
            htmlFor="password"
          >
            Password
          </label>
          <PasswordField value={password} onChange={setPassword} />
          <input type="hidden" name="password" value={password} />
          <PasswordStrengthBar password={password} />
        </div>

        {/* Terms */}
        <div className="flex items-start gap-3 mt-2">
          <div className="flex items-center h-5">
            <input
              id="terms"
              type="checkbox"
              required
              className="w-4 h-4 rounded"
              style={{ accentColor: "#3B82F6", borderColor: "#c2c6d6" }}
            />
          </div>
          <label
            className="text-xs font-medium"
            htmlFor="terms"
            style={{ color: "#424754" }}
          >
            By creating an account, I agree to the{" "}
            <a
              href="#"
              className="hover:underline"
              style={{ color: "#3B82F6" }}
            >
              Terms of Service
            </a>{" "}
            and{" "}
            <a
              href="#"
              className="hover:underline"
              style={{ color: "#3B82F6" }}
            >
              Privacy Policy
            </a>
            .
          </label>
        </div>

        {/* Server-side error message */}
        {state.error && (
          <p className="text-xs font-medium" style={{ color: "#ba1a1a" }}>
            {state.error}
          </p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isPending || state.submitted}
          className="mt-4 w-full text-white py-4 rounded-xl text-sm font-semibold transition-all shadow-md active:scale-[0.98]"
          style={{
            backgroundColor: state.submitted ? "#10B981" : "#3B82F6",
            opacity: isPending ? 0.8 : 1,
          }}
        >
          {state.submitted ? (
            "Account Created!"
          ) : isPending ? (
            <span className="flex items-center justify-center gap-2">
              <span
                className="material-symbols-outlined"
                style={{ animation: "spin 1s linear infinite", fontSize: 20 }}
              >
                progress_activity
              </span>
            </span>
          ) : (
            "Create Account"
          )}
        </button>
      </form>

      <AuthDivider />
      <AuthSocialButtons />

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default RegistrationForm;

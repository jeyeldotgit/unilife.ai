"use client";

import { useActionState, useState } from "react";

import { AuthDivider } from "@/app/(auth)/components/AuthDivider";
import { AuthSocialButtons } from "@/app/(auth)/components/AuthSocialButtons";
import EmailField from "@/app/(auth)/components/EmailField";
import PasswordField from "@/app/(auth)/components/PasswordField";

import { login, type LoginState } from "../actions";

const initialState: LoginState = {
  error: null,
};

const LoginForm = () => {
  const [password, setPassword] = useState("");
  const [state, formAction, isPending] = useActionState(login, initialState);

  return (
    <div
      className="rounded-xl border p-5 shadow-sm"
      style={{
        background: "rgba(255,255,255,0.7)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderColor: "#c2c6d6",
      }}
    >
      <form className="flex flex-col gap-5" action={formAction}>
        <EmailField
          placeholder="you@school.edu"
          autoComplete="email"
          validationMode="basic"
        />

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-4">
            <label
              className="text-sm font-semibold text-[#191c1d]"
              htmlFor="password"
            >
              Password
            </label>
            <span className="text-xs font-medium text-[#3B82F6]">
              Secure access only
            </span>
          </div>
          <PasswordField
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
            placeholder="Enter your password"
          />
        </div>

        <div className="mt-1 flex items-center justify-between gap-4">
          <label
            htmlFor="remember-me"
            className="flex items-center gap-3 text-xs font-medium"
            style={{ color: "#424754" }}
          >
            <input
              id="remember-me"
              name="rememberMe"
              type="checkbox"
              className="h-4 w-4 rounded"
              style={{ accentColor: "#3B82F6", borderColor: "#c2c6d6" }}
            />
            Keep me signed in
          </label>
          <span className="text-xs font-medium text-[#424754]">
            Need help signing in?
          </span>
        </div>

        {state.error && (
          <p className="text-xs font-medium" style={{ color: "#ba1a1a" }}>
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="mt-4 w-full rounded-xl py-4 text-sm font-semibold text-white shadow-md transition-all active:scale-[0.98]"
          style={{
            backgroundColor: "#3B82F6",
            opacity: isPending ? 0.8 : 1,
          }}
        >
          {isPending ? (
            <span className="flex items-center justify-center gap-2">
              <span
                className="material-symbols-outlined"
                style={{ animation: "spin 1s linear infinite", fontSize: 20 }}
              >
                progress_activity
              </span>
            </span>
          ) : (
            "Sign In"
          )}
        </button>
      </form>

      <AuthDivider label="or continue with" />
      <AuthSocialButtons />

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default LoginForm;

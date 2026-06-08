"use server";

import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { createClient } from "@/lib/supabase/server";

export type LoginState = {
  error: string | null;
  submitted?: boolean;
};

export type RegisterState = {
  error: string | null;
  submitted?: boolean;
};

function toUnexpectedErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "An unexpected error occurred.";
}

export async function login(
  _: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const supabase = await createClient();
  const email = formData.get("email")?.toString().trim();
  const password = formData.get("password")?.toString();

  if (!email || !password) {
    return {
      error: "Email and password are required.",
      submitted: false,
    };
  }

  try {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return {
        error: "Invalid email or password.",
        submitted: false,
      };
    }
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    return {
      error: toUnexpectedErrorMessage(error),
      submitted: false,
    };
  }

  redirect("/dashboard");
}

export async function register(
  _: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const supabase = await createClient();
  const email = formData.get("email")?.toString().trim();
  const displayName = formData.get("displayName")?.toString().trim();
  const password = formData.get("password")?.toString();

  if (!displayName || !email || !password) {
    return {
      error: "All fields are required.",
      submitted: false,
    };
  }

  if (password.length < 8) {
    return {
      error: "Password must be at least 8 characters.",
      submitted: false,
    };
  }

  try {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
        },
      },
    });

    if (error) {
      return {
        error: error.message,
        submitted: false,
      };
    }
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    return {
      error: toUnexpectedErrorMessage(error),
      submitted: false,
    };
  }

  redirect("/onboarding");
}

export async function logout() {
  const supabase = await createClient();

  await supabase.auth.signOut();

  redirect("/login");
}

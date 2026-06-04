"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";

export type LoginState = {
  error: string | null;
  submitted?: boolean;
};

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
  } catch (err) {
    if (isRedirectError(err)) throw err;

    if (err instanceof Error) {
      return {
        error: err.message,
        submitted: false,
      };
    }

    return {
      error: "An unexpected error occurred.",
      submitted: false,
    };
  }

  redirect("/dashboard");
}

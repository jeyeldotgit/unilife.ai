"use server";

import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { createClient } from "@/lib/supabase/server";

export type RegisterState = {
  error: string | null;
  submitted?: boolean;
};

export async function register(
  _: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const supabase = await createClient();

  const email = formData.get("email")?.toString().trim();
  const displayName = formData.get("displayName")?.toString().trim();
  const password = formData.get("password")?.toString();

  if (!displayName || !email || !password) {
    return { error: "All fields are required.", submitted: false };
  }

  if (password.length < 8) {
    return {
      error: "Password must be at least 8 characters.",
      submitted: false,
    };
  }

  console.log("FormData: ", { email, displayName });

  try {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
      },
    });

    if (error) {
      return { error: error.message, submitted: false };
    }
  } catch (err) {
    // Re-throw redirect errors — Next.js redirect() throws internally
    // and must not be caught or it silently fails
    if (isRedirectError(err)) throw err;

    if (err instanceof Error) {
      return { error: err.message, submitted: false };
    }

    return { error: "An unexpected error occurred.", submitted: false };
  }

  redirect("/dashboard");
}

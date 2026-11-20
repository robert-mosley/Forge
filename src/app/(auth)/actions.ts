"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/env";
import { initialFormActionState, type FormActionState } from "@/lib/forms";
import { createClient } from "@/lib/supabase/server";
import {
  resetRequestSchema,
  signInSchema,
  signUpSchema,
  updatePasswordSchema,
} from "@/schemas/auth.schema";
import { isProfileComplete } from "@/schemas/profile.schema";
import { getProfileBundle } from "@/services/profile.service";

const setupMessage =
  "Account services are not connected yet. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY";

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

async function getRequestOrigin(): Promise<string | null> {
  const configuredOrigin = process.env.NEXT_PUBLIC_APP_ORIGIN?.trim();
  if (configuredOrigin) {
    try {
      const parsed = new URL(configuredOrigin);
      if (parsed.protocol === "https:" || parsed.protocol === "http:") {
        return parsed.origin;
      }
    } catch {
      // Fall back to request headers below.
    }
  }

  const requestHeaders = await headers();
  const forwardedHost = requestHeaders.get("x-forwarded-host");
  const forwardedProto = requestHeaders.get("x-forwarded-proto");

  if (forwardedHost) {
    const protocol = forwardedProto === "http" || forwardedProto === "https"
      ? forwardedProto
      : "https";
    try {
      const parsed = new URL(`${protocol}://${forwardedHost}`);
      if (parsed.protocol === "https:" || parsed.protocol === "http:") {
        return parsed.origin;
      }
    } catch {
      // Fall back to origin header below.
    }
  }

  const origin = requestHeaders.get("origin");

  if (!origin) {
    return null;
  }

  try {
    const parsed = new URL(origin);
    return parsed.protocol === "https:" || parsed.protocol === "http:"
      ? parsed.origin
      : null;
  } catch {
    return null;
  }
}

function firstValidationMessage(error: { issues: { message: string }[] }) {
  return error.issues[0]?.message ?? "Check the information and try again.";
}

function rateLimitAuthError(message: string): string {
  const waitMatch = message.match(/(\d+)\s*(second|seconds|minute|minutes)/i);
  const waitHint = waitMatch
    ? ` Wait about ${waitMatch[1]} ${waitMatch[2].toLowerCase()} before trying again.`
    : " Wait 5-10 minutes before trying again.";

  const base =
    "Too many auth attempts right now. This is usually a Supabase Auth rate limit on free tier.";

  if (process.env.NODE_ENV !== "production") {
    return `${base}${waitHint} Supabase said: ${message}`;
  }

  return `${base}${waitHint}`;
}

function genericAuthError(message: string): string {
  if (/invalid login credentials/i.test(message)) {
    return "That email and password combination was not recognized.";
  }

  if (/email not confirmed/i.test(message)) {
    return "Confirm your email address before signing in.";
  }

  if (/rate limit/i.test(message)) {
    return rateLimitAuthError(message);
  }

  return "We could not complete that request. Please try again.";
}

export async function signInAction(
  _previousState: FormActionState = initialFormActionState,
  formData: FormData,
): Promise<FormActionState> {
  void _previousState;
  const parsed = signInSchema.safeParse({
    email: field(formData, "email"),
    password: field(formData, "password"),
  });

  if (!parsed.success) {
    return { status: "error", message: firstValidationMessage(parsed.error) };
  }

  if (!isSupabaseConfigured()) {
    return { status: "error", message: setupMessage };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error || !data.user) {
    return {
      status: "error",
      message: genericAuthError(error?.message ?? "Sign-in failed."),
    };
  }

  try {
    const bundle = await getProfileBundle(supabase, data.user.id);
    redirect(
      isProfileComplete(bundle.profile, bundle.selectedSkills.length)
        ? "/dashboard"
        : "/profile/setup",
    );
  } catch (profileError) {
    if (profileError && typeof profileError === "object" && "digest" in profileError) {
      throw profileError;
    }

    return {
      status: "error",
      message:
        profileError instanceof Error
          ? profileError.message
          : "We could not load your profile. Please try again.",
    };
  }
}

export async function signUpAction(
  _previousState: FormActionState = initialFormActionState,
  formData: FormData,
): Promise<FormActionState> {
  void _previousState;
  const parsed = signUpSchema.safeParse({
    email: field(formData, "email"),
    password: field(formData, "password"),
    confirmPassword: field(formData, "confirmPassword"),
  });

  if (!parsed.success) {
    return { status: "error", message: firstValidationMessage(parsed.error) };
  }

  if (!isSupabaseConfigured()) {
    return { status: "error", message: setupMessage };
  }

  const origin = await getRequestOrigin();
  if (!origin) {
    return {
      status: "error",
      message: "We could not establish a secure confirmation link. Refresh and try again.",
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=%2Fprofile%2Fsetup`,
    },
  });

  if (error) {
    return { status: "error", message: genericAuthError(error.message) };
  }

  if (data.session) {
    redirect("/profile/setup");
  }

  return {
    status: "success",
    message:
      "If an account can be created for this address, check your email for a confirmation link.",
  };
}

export async function requestPasswordResetAction(
  _previousState: FormActionState = initialFormActionState,
  formData: FormData,
): Promise<FormActionState> {
  void _previousState;
  const parsed = resetRequestSchema.safeParse({
    email: field(formData, "email"),
  });

  if (!parsed.success) {
    return { status: "error", message: firstValidationMessage(parsed.error) };
  }

  if (!isSupabaseConfigured()) {
    return { status: "error", message: setupMessage };
  }

  const origin = await getRequestOrigin();
  if (!origin) {
    return {
      status: "error",
      message: "We could not establish a secure reset link. Refresh and try again.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/auth/callback?next=%2Freset-password`,
  });

  if (error) {
    return { status: "error", message: genericAuthError(error.message) };
  }

  return {
    status: "success",
    message: "If an account matches that address, a password reset link is on its way.",
  };
}

export async function updatePasswordAction(
  _previousState: FormActionState = initialFormActionState,
  formData: FormData,
): Promise<FormActionState> {
  void _previousState;
  const parsed = updatePasswordSchema.safeParse({
    password: field(formData, "password"),
    confirmPassword: field(formData, "confirmPassword"),
  });

  if (!parsed.success) {
    return { status: "error", message: firstValidationMessage(parsed.error) };
  }

  if (!isSupabaseConfigured()) {
    return { status: "error", message: setupMessage };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      status: "error",
      message: "This reset link is no longer valid. Request a new one and try again.",
    };
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return { status: "error", message: genericAuthError(error.message) };
  }

  let hasCompleteProfile = false;
  try {
    const bundle = await getProfileBundle(supabase, user.id);
    hasCompleteProfile = isProfileComplete(
      bundle.profile,
      bundle.selectedSkills.length,
    );
  } catch {
    return {
      status: "error",
      message: "Your password was updated, but KSUForge could not load your profile. Try signing in.",
    };
  }

  redirect(hasCompleteProfile ? "/dashboard" : "/profile/setup");
}

export async function signOutAction(): Promise<void> {
  if (!isSupabaseConfigured()) {
    redirect("/login?setup=missing");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    redirect("/dashboard?notice=signout-failed");
  }

  redirect("/login?signedOut=1");
}

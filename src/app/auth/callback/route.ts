import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

const allowedDestinations = new Set([
  "/dashboard",
  "/profile/setup",
  "/reset-password",
]);

function getSafeDestination(value: string | null): string {
  return value && allowedDestinations.has(value) ? value : "/profile/setup";
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);

  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(
      new URL("/login?setup=missing", requestUrl.origin),
    );
  }

  const code = requestUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(
      new URL("/login?notice=confirmation-failed", requestUrl.origin),
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL("/login?notice=confirmation-failed", requestUrl.origin),
    );
  }

  const destination = getSafeDestination(
    requestUrl.searchParams.get("next"),
  );

  return NextResponse.redirect(new URL(destination, requestUrl.origin));
}

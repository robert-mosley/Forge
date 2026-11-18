import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export async function requireUser() {
  if (!isSupabaseConfigured()) {
    redirect("/login?setup=missing");
  }

  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    redirect("/login?notice=session");
  }

  if (!user) {
    redirect("/login");
  }

  return { supabase, user };
}

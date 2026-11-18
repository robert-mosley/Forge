import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { isProfileComplete } from "@/schemas/profile.schema";
import { getProfileBundle } from "@/services/profile.service";

export async function redirectIfAuthenticated(): Promise<void> {
  if (!isSupabaseConfigured()) {
    return;
  }

  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return;
  }

  let destination = "/profile/setup";

  try {
    const bundle = await getProfileBundle(supabase, user.id);
    if (isProfileComplete(bundle.profile, bundle.selectedSkills.length)) {
      destination = "/dashboard";
    }
  } catch {
    destination = "/profile/setup?notice=database";
  }

  redirect(destination);
}

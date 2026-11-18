"use server";

import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/env";
import { initialFormActionState, type FormActionState } from "@/lib/forms";
import { createClient } from "@/lib/supabase/server";
import { profileSchema } from "@/schemas/profile.schema";
import {
  ProfileServiceError,
  saveOwnProfile,
} from "@/services/profile.service";

function textField(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

export async function saveProfileAction(
  _previousState: FormActionState = initialFormActionState,
  formData: FormData,
): Promise<FormActionState> {
  void _previousState;
  if (!isSupabaseConfigured()) {
    return {
      status: "error",
      message:
        "Profile storage is not connected yet. Add the Supabase URL and anon key in Replit Secrets.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const skills = formData
    .getAll("skill_id")
    .filter((value): value is string => typeof value === "string")
    .map((skillId) => ({
      skill_id: skillId,
      proficiency: textField(formData, `proficiency:${skillId}`),
    }));

  const parsed = profileSchema.safeParse({
    full_name: textField(formData, "full_name"),
    username: textField(formData, "username"),
    major: textField(formData, "major"),
    campus: textField(formData, "campus"),
    bio: textField(formData, "bio"),
    github_username: textField(formData, "github_username"),
    skills,
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Check your profile details.",
    };
  }

  try {
    await saveOwnProfile(supabase, user.id, parsed.data);
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof ProfileServiceError
          ? error.message
          : "Your profile could not be saved. Please try again.",
    };
  }

  redirect(
    textField(formData, "return_to") === "/profile"
      ? "/profile?updated=1"
      : "/dashboard",
  );
}

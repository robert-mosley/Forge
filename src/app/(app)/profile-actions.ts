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
import { generateClaudePortfolio } from "@/services/ai.service";
import {
  importGitHubPortfolio,
  PortfolioImportError,
} from "@/services/portfolio.service";

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
        "Profile storage is not connected yet. Add the Supabase URL.",
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

  let profilePictureUrl = textField(formData, "profile_picture_url") || null;
  const picture = formData.get("profile_picture");
  if (picture instanceof File && picture.size > 0) {
    if (picture.size > 5 * 1024 * 1024) {
      return { status: "error", message: "Profile pictures must be smaller than 5 MB." };
    }
    const extension = picture.name.split(".").pop()?.replace(/[^a-z0-9]/gi, "") || "jpg";
    const path = `${user.id}/profile-${Date.now()}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, picture, { contentType: picture.type, upsert: true });
    if (uploadError) {
      return { status: "error", message: "Your profile picture could not be uploaded." };
    }
    const { data: publicUrl } = supabase.storage.from("avatars").getPublicUrl(path);
    profilePictureUrl = publicUrl.publicUrl;
  }

  const skills = formData
    .getAll("skill_id")
    .filter((value): value is string => typeof value === "string")
    .map((skillId) => ({
      skill_id: skillId,
      proficiency: textField(formData, `proficiency:${skillId}`),
    }));

  const interests = formData
    .getAll("interest")
    .filter((value): value is string => typeof value === "string");

  const parsed = profileSchema.safeParse({
    full_name: textField(formData, "full_name"),
    username: textField(formData, "username"),
    major: textField(formData, "major"),
    campus: textField(formData, "campus"),
    bio: textField(formData, "bio"),
    academic_year: textField(formData, "academic_year") || null,
    interests,
    profile_picture_url: profilePictureUrl,
    github_username: textField(formData, "github_username") || null,
    github_url: textField(formData, "github_url") || null,
    is_discoverable: formData.get("is_discoverable") === "on",
    show_availability: formData.get("show_availability") === "on",
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

  const returnTo = textField(formData, "return_to");
  redirect(
    returnTo === "/profile"
      ? "/profile?updated=1"
      : returnTo === "/profile/setup"
        ? "/profile/setup"
        : "/dashboard",
  );
}

export type PortfolioImportState = FormActionState & {
  importedCount?: number;
};

export async function importGitHubPortfolioAction(
  _previousState: PortfolioImportState = initialFormActionState,
  formData: FormData,
): Promise<PortfolioImportState> {
  void _previousState;

  if (!isSupabaseConfigured()) {
    return {
      status: "error",
      message: "Account services are not connected yet.",
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

  const githubUsername = textField(formData, "github_username").replace(/^@/, "").trim();
  const returnTo = textField(formData, "return_to");
  if (!githubUsername) {
    return { status: "error", message: "Enter your GitHub username first." };
  }

  try {
    const portfolio = await generateClaudePortfolio(githubUsername);
    await importGitHubPortfolio(supabase, user.id, portfolio);

    redirect(returnTo === "/profile?edit=1" ? "/profile?edit=1&imported=1" : "/profile/setup?imported=1");
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) {
      throw error;
    }

    return {
      status: "error",
      message:
        error instanceof PortfolioImportError || error instanceof Error
          ? error.message
          : "GitHub portfolio import failed. Please try again.",
    };
  }
}

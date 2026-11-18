import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Database,
  ProfileRow,
  SkillRow,
  StudentSkillRow,
} from "@/types/database";
import type { ProfileInput } from "@/schemas/profile.schema";

export type ForgeSupabaseClient = SupabaseClient<Database>;

export type ProfileBundle = {
  profile: ProfileRow | null;
  skills: SkillRow[];
  selectedSkills: StudentSkillRow[];
};

export class ProfileServiceError extends Error {
  constructor(
    message: string,
    readonly code?: string,
  ) {
    super(message);
    this.name = "ProfileServiceError";
  }
}

export async function getProfileBundle(
  supabase: ForgeSupabaseClient,
  userId: string,
): Promise<ProfileBundle> {
  const [profileResult, skillResult, selectedResult] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "id, username, full_name, major, campus, bio, github_username, created_at",
      )
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("skills")
      .select("id, canonical_name, category, created_at")
      .order("category")
      .order("canonical_name"),
    supabase
      .from("student_skills")
      .select("user_id, skill_id, proficiency, source")
      .eq("user_id", userId)
      .eq("source", "manual"),
  ]);

  const failedResult = [profileResult, skillResult, selectedResult].find(
    (result) => result.error,
  );

  if (failedResult?.error) {
    throw new ProfileServiceError(
      "Forge could not load profile data. Confirm the latest Supabase migrations are applied.",
      failedResult.error.code,
    );
  }

  return {
    profile: profileResult.data,
    skills: skillResult.data ?? [],
    selectedSkills: selectedResult.data ?? [],
  };
}

export async function saveOwnProfile(
  supabase: ForgeSupabaseClient,
  userId: string,
  input: ProfileInput,
): Promise<void> {
  const { data: existingSkills, error: existingError } = await supabase
    .from("student_skills")
    .select("skill_id")
    .eq("user_id", userId)
    .eq("source", "manual");

  if (existingError) {
    throw new ProfileServiceError(
      "Forge could not load your current skills. Confirm the latest Supabase migrations are applied.",
      existingError.code,
    );
  }

  const { error: profileError } = await supabase.from("profiles").upsert(
    {
      id: userId,
      username: input.username,
      full_name: input.full_name,
      major: input.major,
      campus: input.campus,
      bio: input.bio,
      github_username: input.github_username,
    },
    { onConflict: "id" },
  );

  if (profileError) {
    if (profileError.code === "23505") {
      throw new ProfileServiceError(
        "That username is already taken. Try another one.",
        profileError.code,
      );
    }

    throw new ProfileServiceError(
      "Your profile could not be saved. Please try again.",
      profileError.code,
    );
  }

  const selectedIds = new Set(input.skills.map((skill) => skill.skill_id));
  const removedIds = (existingSkills ?? [])
    .map((skill) => skill.skill_id)
    .filter((skillId) => !selectedIds.has(skillId));

  const { error: upsertError } = await supabase.from("student_skills").upsert(
    input.skills.map((skill) => ({
      user_id: userId,
      skill_id: skill.skill_id,
      proficiency: skill.proficiency,
      source: "manual" as const,
    })),
    { onConflict: "user_id,skill_id,source" },
  );

  if (upsertError) {
    throw new ProfileServiceError(
      "Your profile details were saved, but your skills could not be updated. Please try again.",
      upsertError.code,
    );
  }

  if (removedIds.length > 0) {
    const { error: deleteError } = await supabase
      .from("student_skills")
      .delete()
      .eq("user_id", userId)
      .eq("source", "manual")
      .in("skill_id", removedIds);

    if (deleteError) {
      throw new ProfileServiceError(
        "Your profile and selected skills were saved, but an old skill could not be removed. Please try again.",
        deleteError.code,
      );
    }
  }
}

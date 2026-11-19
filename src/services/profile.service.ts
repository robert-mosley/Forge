import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Database,
  ProfileRow,
  SkillRow,
  StudentSkillRow,
} from "@/types/database";
import type { ProfileInput } from "@/schemas/profile.schema";
import { embedText } from "@/services/embedding.service";

export type KSUForgeSupabaseClient = SupabaseClient<Database>;

export type ProfileBundle = {
  profile: ProfileRow | null;
  skills: SkillRow[];
  selectedSkills: StudentSkillRow[];
};

export class ProfileServiceError extends Error {
  constructor(
    message: string,
    readonly code?: string,
    readonly detail?: string,
  ) {
    super(message);
    this.name = "ProfileServiceError";
  }
}

export async function getProfileBundle(
  supabase: KSUForgeSupabaseClient,
  userId: string,
): Promise<ProfileBundle> {
  let profileResult = await supabase
    .from("profiles")
    .select(
      "id, username, full_name, major, campus, bio, github_username, github_url, profile_picture_url, academic_year, interests, is_discoverable, show_availability, embedding, created_at",
    )
    .eq("id", userId)
    .maybeSingle();

  if (profileResult.error?.code === "PGRST204") {
    profileResult = await supabase
      .from("profiles")
      .select("id, username, full_name, major, campus, bio, github_username, created_at")
      .eq("id", userId)
      .maybeSingle();
  }

  const [skillResult, selectedResult] = await Promise.all([
    supabase
      .from("skills")
      .select("id, canonical_name, category, created_at")
      .order("category")
      .order("canonical_name"),
    supabase
      .from("student_skills")
      .select("user_id, skill_id, proficiency, source")
      .eq("user_id", userId),
  ]);

  const failedResult = [profileResult, skillResult].find(
    (result) => result.error,
  );

  if (failedResult?.error) {
    throw new ProfileServiceError(
      "KSUForge could not load profile data. Confirm the latest Supabase migrations are applied.",
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
  supabase: KSUForgeSupabaseClient,
  userId: string,
  input: ProfileInput,
): Promise<void> {
  const existingSkillsResult = await supabase
    .from("student_skills")
    .select("skill_id")
    .eq("user_id", userId)
    .eq("source", "manual");

  const { data: existingSkills } = existingSkillsResult;

  const { error: profileError } = await supabase.from("profiles").upsert(
    {
      id: userId,
      username: input.username,
      full_name: input.full_name,
      major: input.major,
      campus: input.campus,
      bio: input.bio,
      github_username: input.github_username,
      github_url: input.github_url ?? null,
      profile_picture_url: input.profile_picture_url ?? null,
      academic_year: input.academic_year ?? null,
      interests: input.interests,
      is_discoverable: input.is_discoverable,
      show_availability: input.show_availability,
      embedding: await embedText([
        input.full_name,
        input.major,
        input.campus,
        input.bio,
        input.interests.join(" "),
        input.skills.map((skill) => skill.skill_id).join(" "),
      ].filter(Boolean).join(" ")),
    },
    { onConflict: "id" },
  );

  let resolvedProfileError = profileError;
  if (profileError?.code === "PGRST204" || profileError?.code === "42703") {
    const baseResult = await supabase.from("profiles").upsert(
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
    resolvedProfileError = baseResult.error;
  }

  if (resolvedProfileError) {
    const databaseMessage = resolvedProfileError.message?.trim();
    throw new ProfileServiceError(
      databaseMessage
        ? `Your profile could not be saved: ${databaseMessage}`
        : "Your profile could not be saved. Please try again.",
      resolvedProfileError.code,
      resolvedProfileError.details,
    );
  }

  const selectedIds = new Set(input.skills.map((skill) => skill.skill_id));
  const removedIds = (existingSkills ?? [])
    .map((skill) => skill.skill_id)
    .filter((skillId) => !selectedIds.has(skillId));

  if (input.skills.length > 0) {
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

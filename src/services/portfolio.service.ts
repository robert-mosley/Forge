import type { KSUForgeSupabaseClient } from "@/services/profile.service";
import type { GitHubPortfolio } from "@/services/github.service";

export class PortfolioImportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PortfolioImportError";
  }
}

function generatedUsername(githubUsername: string, userId: string): string {
  const base = githubUsername
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 18) || "forge_builder";

  const suffix = userId.replace(/-/g, "").slice(0, 5);
  return `${base}_${suffix}`.slice(0, 24);
}

export async function importGitHubPortfolio(
  supabase: KSUForgeSupabaseClient,
  userId: string,
  portfolio: GitHubPortfolio,
): Promise<void> {
  const { data: existing, error: profileReadError } = await supabase
    .from("profiles")
    .select("username, full_name, major, campus, bio")
    .eq("id", userId)
    .maybeSingle();

  if (profileReadError) {
    throw new PortfolioImportError("Your profile could not be loaded for import.");
  }

  const baseUsername = existing?.username?.trim() || generatedUsername(portfolio.username, userId);
  const fullName = existing?.full_name?.trim() || portfolio.display_name?.trim() || portfolio.username;
  const bio = existing?.bio?.trim() || portfolio.profile_summary?.trim() || portfolio.bio?.trim() ||
    `Builder working across ${portfolio.skills.slice(0, 4).join(", ") || "software projects"}.`;

  const { error: profileError } = await supabase.from("profiles").upsert(
    {
      id: userId,
      username: baseUsername,
      full_name: fullName,
      major: existing?.major ?? null,
      campus: existing?.campus ?? null,
      bio,
      github_username: portfolio.username,
    },
    { onConflict: "id" },
  );

  if (profileError) {
    throw new PortfolioImportError(
      profileError.code === "23505"
        ? "That username is already taken. Change it on the profile form after import."
        : "Your GitHub profile could not be saved.",
    );
  }

  const { data: skills, error: skillsError } = await supabase
    .from("skills")
    .select("id, canonical_name");

  if (skillsError) {
    throw new PortfolioImportError("The skill catalog could not be loaded.");
  }

  const skillIdByName = new Map(
    (skills ?? []).map((skill) => [skill.canonical_name, skill.id]),
  );

  const projectSkills = portfolio.projects.flatMap((project) =>
    project.skills
      .map((skillName) => ({
        skillName,
        repoName: project.repo_name,
      }))
      .filter(({ skillName }) => skillIdByName.has(skillName)),
  );

  for (const project of portfolio.projects) {
    const { data: savedProject, error: projectError } = await supabase
      .from("projects")
      .upsert(
        {
          user_id: userId,
          github_url: project.github_url,
          repo_name: project.repo_name,
          description: project.description,
          technical_overview: project.technical_overview,
          tech_stack: project.tech_stack,
          processing_status: "ready",
        },
        { onConflict: "user_id,repo_name" },
      )
      .select("id")
      .single();

    if (projectError || !savedProject) {
      throw new PortfolioImportError(
        `KSUForge could not save the GitHub project ${project.repo_name}.`,
      );
    }

    const evidenceBySkillId = new Map<string, {
      project_id: string;
      skill_id: string;
      confidence: number;
      evidence_type: "readme";
      evidence_text: string;
      evidence_url: string;
    }>();

    for (const skillName of project.skills) {
      const skillId = skillIdByName.get(skillName);
      if (!skillId || evidenceBySkillId.has(skillId)) continue;

      evidenceBySkillId.set(skillId, {
        project_id: savedProject.id,
        skill_id: skillId,
        confidence: 0.75,
        evidence_type: "readme",
        evidence_text: project.description || project.technical_overview || project.repo_name,
        evidence_url: project.github_url,
      });
    }

    const evidenceRows = [...evidenceBySkillId.values()];

    if (evidenceRows.length > 0) {
      const { error: evidenceError } = await supabase
        .from("project_skills")
        .upsert(evidenceRows, { onConflict: "project_id,skill_id" });

      if (evidenceError) {
        // Keep import resilient: if the bulk write fails, try row-by-row and continue.
        for (const row of evidenceRows) {
          await supabase
            .from("project_skills")
            .upsert(row, { onConflict: "project_id,skill_id" });
        }
      }
    }
  }

  const studentSkillRows = [...new Set(projectSkills.map(({ skillName }) => skillName))]
    .map((skillName) => {
      const skillId = skillIdByName.get(skillName);
      if (!skillId) return null;
      return {
        user_id: userId,
        skill_id: skillId,
        proficiency: "intermediate" as const,
        source: "project" as const,
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null);

  if (studentSkillRows.length > 0) {
    const { error: studentSkillsError } = await supabase
      .from("student_skills")
      .upsert(studentSkillRows, { onConflict: "user_id,skill_id,source" });

    if (studentSkillsError) {
      throw new PortfolioImportError("Your GitHub skills could not be added to the profile.");
    }
  }
}

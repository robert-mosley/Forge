import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export type KSUForgeSupabaseClient = SupabaseClient<Database>;

export type StudentMatch = {
  id: string;
  username: string | null;
  full_name: string | null;
  major: string | null;
  campus: string | null;
  academic_year: string | null;
  profile_picture_url: string | null;
  interests: string[];
  sharedInterests: string[];
  sharedSkills: string[];
  complementarySkills: string[];
  score: number;
};

export type ProjectMatch = {
  id: string;
  title: string;
  description: string | null;
  discipline: string | null;
  project_type: string | null;
  tech_stack: string[];
  seeking_collaborators: boolean;
  collaboration_roles: string[];
  post_summary: string | null;
  user_id: string;
  created_at: string;
  score: number;
  semantic_similarity?: number;
  owner?: {
    username: string | null;
    full_name: string | null;
    profile_picture_url: string | null;
  } | null;
};

function normalize(value: string): string {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, " ");
}

function overlap(a: string[], b: string[]): string[] {
  const normalizedB = new Set(b.map(normalize));
  return [...new Set(a.filter((value) => normalizedB.has(normalize(value))))];
}

export async function getStudentMatches(
  supabase: KSUForgeSupabaseClient,
  userId: string,
  limit = 12,
): Promise<StudentMatch[]> {
  const [{ data: ownProfile }, { data: ownSkills }, { data: students }, { data: allSkills }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, interests, major, campus")
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("student_skills")
      .select("skill_id")
      .eq("user_id", userId),
    supabase
      .from("profiles")
      .select("id, username, full_name, major, campus, academic_year, profile_picture_url, interests")
      .eq("is_discoverable", true)
      .neq("id", userId),
    supabase.from("skills").select("id, canonical_name"),
  ]);

  const ownSkillIds = new Set((ownSkills ?? []).map((row) => row.skill_id));
  const skillNameById = new Map((allSkills ?? []).map((skill) => [skill.id, skill.canonical_name]));
  const ownSkillsNames = [...ownSkillIds].map((id) => skillNameById.get(id)).filter((value): value is string => Boolean(value));

  const studentIds = (students ?? []).map((student) => student.id);
  const { data: studentSkillRows } = studentIds.length
    ? await supabase.from("student_skills").select("user_id, skill_id").in("user_id", studentIds)
    : { data: [] };

  const ownInterests = ownProfile?.interests ?? [];
  const ownMajor = ownProfile?.major ?? "";
  const ownCampus = ownProfile?.campus ?? "";

  return (students ?? []).map((student) => {
    const studentSkillNames = [...new Set((studentSkillRows ?? [])
      .filter((row) => row.user_id === student.id)
      .map((row) => skillNameById.get(row.skill_id))
      .filter((value): value is string => Boolean(value)))];

    const sharedInterests = overlap(ownInterests, student.interests ?? []);
    const sharedSkills = overlap(ownSkillsNames, studentSkillNames);
    const complementarySkills = studentSkillNames.filter(
      (skill) => !ownSkillsNames.some((ownSkill) => normalize(ownSkill) === normalize(skill)),
    );

    const interestScore = Math.min(sharedInterests.length / Math.max(ownInterests.length, 1), 1) * 40;
    const skillScore = Math.min(sharedSkills.length / Math.max(ownSkillsNames.length, 1), 1) * 25;
    const complementaryScore = Math.min(complementarySkills.length / 5, 1) * 15;
    const majorScore = ownMajor && normalize(ownMajor) === normalize(student.major ?? "") ? 15 : 5;
    const campusScore = ownCampus && normalize(ownCampus) === normalize(student.campus ?? "") ? 5 : 0;
    const score = Math.round(Math.min(100, interestScore + skillScore + complementaryScore + majorScore + campusScore));

    return {
      ...student,
      sharedInterests,
      sharedSkills,
      complementarySkills: complementarySkills.slice(0, 5),
      score,
    };
  }).sort((a, b) => b.score - a.score).slice(0, limit);
}

export async function getProjectFeedMatches(
  supabase: KSUForgeSupabaseClient,
  userId: string,
  limit = 30,
): Promise<ProjectMatch[]> {
  const [{ data: profile }, { data: ownSkills }, { data: projects }, { data: skillCatalog }] = await Promise.all([
    supabase
      .from("profiles")
      .select("interests, major, embedding")
      .eq("id", userId)
      .maybeSingle(),
    supabase.from("student_skills").select("skill_id").eq("user_id", userId),
    supabase
      .from("projects")
      .select("id, user_id, title, repo_name, description, post_summary, discipline, project_type, tech_stack, seeking_collaborators, collaboration_roles, embedding, created_at")
      .eq("is_public", true)
      .neq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(100),
    supabase.from("skills").select("id, canonical_name"),
  ]);

  const skillNameById = new Map((skillCatalog ?? []).map((skill) => [skill.id, skill.canonical_name]));
  const ownSkillNames = (ownSkills ?? [])
    .map((row) => skillNameById.get(row.skill_id))
    .filter((value): value is string => Boolean(value));
  const userInterests = profile?.interests ?? [];

  const ownerIds = [...new Set((projects ?? []).map((project) => project.user_id))];
  const { data: owners } = ownerIds.length
    ? await supabase
        .from("profiles")
        .select("id, username, full_name, profile_picture_url")
        .in("id", ownerIds)
    : { data: [] };

  const ownerById = new Map((owners ?? []).map((owner) => [owner.id, owner]));

  const baseMatches = (projects ?? []).map((project) => {
    const projectText = [
      project.title,
      project.description,
      project.post_summary,
      project.discipline,
      project.project_type,
      ...(project.tech_stack ?? []),
      ...(project.collaboration_roles ?? []),
    ].filter((value): value is string => Boolean(value));

    const techMatches = overlap(ownSkillNames, project.tech_stack ?? []);
    const interestMatches = overlap(userInterests, projectText);
    const disciplineMatch = project.discipline
      ? normalize(project.discipline).includes(normalize(profile?.major ?? "")) ||
        normalize(profile?.major ?? "").includes(normalize(project.discipline))
      : false;

    const interestScore = Math.min(interestMatches.length / Math.max(userInterests.length, 1), 1) * 35;
    const skillScore = Math.min(techMatches.length / Math.max(ownSkillNames.length, 1), 1) * 40;
    const disciplineScore = disciplineMatch ? 15 : 0;
    const collaborationScore = project.seeking_collaborators ? 10 : 0;
    const score = Math.round(Math.min(100, interestScore + skillScore + disciplineScore + collaborationScore));

    return {
      ...project,
      title: project.title || project.repo_name,
      score,
      owner: ownerById.get(project.user_id) ?? null,
    };
  });

  if (!profile?.embedding?.length) {
    return baseMatches
      .sort((a, b) => b.score - a.score || new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit);
  }

  try {
    const backendUrl = (process.env.FASTAPI_BACKEND_URL ?? "http://127.0.0.1:8000").replace(/\/$/, "");
    const response = await fetch(`${backendUrl}/feed/rank`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        profile_embedding: profile.embedding,
        candidates: baseMatches.map((project) => ({
          id: project.id,
          base_score: project.score,
          data: {
            embedding: (projects ?? []).find((candidate) => candidate.id === project.id)?.embedding ?? null,
            created_at: project.created_at,
          },
        })),
      }),
      cache: "no-store",
    });

    if (response.ok) {
      const payload = await response.json() as {
        projects?: Array<{ id: string; score: number; semantic_similarity: number }>;
      };
      const rankedById = new Map((payload.projects ?? []).map((project) => [project.id, project]));

      return baseMatches
        .map((project) => {
          const ranked = rankedById.get(project.id);
          return ranked
            ? { ...project, score: ranked.score, semantic_similarity: ranked.semantic_similarity }
            : project;
        })
        .sort((a, b) => b.score - a.score || new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, limit);
    }
  } catch {
    // Keep the rule-based feed usable if FastAPI is temporarily unavailable.
  }

  return baseMatches
    .sort((a, b) => b.score - a.score || new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, limit);
}

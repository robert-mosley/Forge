import type { Database } from "@/types/database";
import type { SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { embedText } from "@/services/embedding.service";

export type KSUForgeSupabaseClient = SupabaseClient<Database>;

export class ProjectServiceError extends Error {
  constructor(message: string, readonly code?: string, readonly detail?: string) {
    super(message);
    this.name = "ProjectServiceError";
  }
}

export async function createOwnProject(
  supabase: KSUForgeSupabaseClient,
  userId: string,
  input: {
    title: string;
    description: string;
    discipline: string;
    project_type: string;
    student_role: string;
    contributions: string;
    outcomes: string;
    tech_stack: string[];
    github_url: string | null;
    is_public: boolean;
    seeking_collaborators: boolean;
    collaboration_roles: string[];
    post_summary: string;
  },
) {
  const repoName = input.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "forge-project";

  const { data, error } = await supabase
    .from("projects")
    .upsert({
      user_id: userId,
      repo_name: repoName,
      title: input.title,
      description: input.description || null,
      technical_overview: input.description || null,
      discipline: input.discipline,
      project_type: input.project_type,
      student_role: input.student_role || null,
      contributions: input.contributions || null,
      outcomes: input.outcomes || null,
      tech_stack: input.tech_stack,
      github_url: input.github_url,
      processing_status: "ready",
      is_public: input.is_public,
      seeking_collaborators: input.seeking_collaborators,
      collaboration_roles: input.collaboration_roles,
      post_summary: input.post_summary || null,
      embedding: await embedText(`${input.title} ${input.description}`),
    }, { onConflict: "user_id,repo_name" })
    .select("id")
    .single();

  if (error || !data) {
    throw new ProjectServiceError(
      error?.message?.trim()
        ? `Your project could not be saved: ${error.message}`
        : "Your project could not be saved. Please try again.",
      error?.code,
      error?.details,
    );
  }

  return data;
}

export async function saveProjectEvidence(
  supabase: KSUForgeSupabaseClient,
  userId: string,
  projectId: string,
  files: File[],
) {
  for (const file of files.slice(0, 8)) {
    const safeName = file.name.replace(/[^A-Za-z0-9._-]/g, "-");
    const path = `${userId}/${projectId}/${randomUUID()}-${safeName}`;
    const { error: uploadError } = await supabase.storage
      .from("project-evidence")
      .upload(path, file, { contentType: file.type || "application/octet-stream", upsert: false });

    if (uploadError) {
      throw new ProjectServiceError(`Evidence file "${file.name}" could not be uploaded.`);
    }

    const { data: publicUrl } = supabase.storage
      .from("project-evidence")
      .getPublicUrl(path);

    const { error: evidenceError } = await supabase
      .from("project_evidence")
      .insert({
        project_id: projectId,
        title: file.name,
        file_name: file.name,
        file_type: file.type || null,
        file_url: publicUrl.publicUrl,
        storage_path: path,
        kind: "attachment",
      });

    if (evidenceError) {
      throw new ProjectServiceError(`Evidence metadata for "${file.name}" could not be saved.`);
    }
  }
}

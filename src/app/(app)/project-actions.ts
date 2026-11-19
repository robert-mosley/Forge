"use server";

import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/env";
import { initialFormActionState, type FormActionState } from "@/lib/forms";
import { createClient } from "@/lib/supabase/server";
import { projectSchema } from "@/schemas/project.schema";
import { createOwnProject, saveProjectEvidence, ProjectServiceError } from "@/services/project.service";

function textField(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

export async function createProjectAction(
  _previousState: FormActionState = initialFormActionState,
  formData: FormData,
): Promise<FormActionState> {
  void _previousState;

  if (!isSupabaseConfigured()) {
    return { status: "error", message: "Project storage is not connected yet." };
  }

  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect("/login");

  const parsed = projectSchema.safeParse({
    title: textField(formData, "title"),
    description: textField(formData, "description"),
    discipline: textField(formData, "discipline"),
    project_type: textField(formData, "project_type"),
    student_role: textField(formData, "student_role"),
    contributions: textField(formData, "contributions"),
    outcomes: textField(formData, "outcomes"),
    tech_stack: formData
      .getAll("tech_stack")
      .filter((value): value is string => typeof value === "string")
      .flatMap((value) => value.split(","))
      .map((value) => value.trim())
      .filter(Boolean),
    github_url: textField(formData, "github_url") || null,
    is_public: formData.get("is_public") !== "off",
    seeking_collaborators: formData.get("seeking_collaborators") === "on",
    collaboration_roles: formData
      .getAll("collaboration_roles")
      .filter((value): value is string => typeof value === "string")
      .flatMap((value) => value.split(","))
      .map((value) => value.trim())
      .filter(Boolean),
    post_summary: textField(formData, "post_summary"),
  });

  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Check the project details." };
  }

  try {
    const project = await createOwnProject(supabase, user.id, {
      ...parsed.data,
      github_url: parsed.data.github_url ?? null,
    });

    const evidenceFiles = formData
      .getAll("evidence")
      .filter((value): value is File => typeof value !== "string" && value instanceof File);

    if (evidenceFiles.length > 0) {
      await saveProjectEvidence(supabase, user.id, project.id, evidenceFiles);
    }
  } catch (caught) {
    return {
      status: "error",
      message: caught instanceof ProjectServiceError ? caught.message : "Your project could not be saved.",
    };
  }

  redirect(textField(formData, "return_to") === "/profile" ? "/profile?project=1" : "/dashboard?project=1");
}

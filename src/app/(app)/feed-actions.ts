"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function toggleProjectAction(formData: FormData): Promise<void> {
  const projectId = formData.get("project_id")?.toString();
  const action = formData.get("action")?.toString();

  if (!projectId || !["like", "save", "interest"].includes(action ?? "")) {
    return;
  }

  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect("/login");

  const { data: existing } = await supabase
    .from("project_feed_actions")
    .select("project_id")
    .eq("project_id", projectId)
    .eq("user_id", user.id)
    .eq("action", action as "like" | "save" | "interest")
    .maybeSingle();

  if (existing) {
    await supabase
      .from("project_feed_actions")
      .delete()
      .eq("project_id", projectId)
      .eq("user_id", user.id)
      .eq("action", action as "like" | "save" | "interest");
  } else {
    await supabase
      .from("project_feed_actions")
      .insert({
        project_id: projectId,
        user_id: user.id,
        action: action as "like" | "save" | "interest",
      });
  }

  revalidatePath("/feed");
  revalidatePath("/dashboard");
  revalidatePath(`/projects/${projectId}`);
}

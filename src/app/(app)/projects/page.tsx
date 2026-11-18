import Link from "next/link";
import { WorkspaceMessage } from "@/components/app/workspace-message";
import { requireUser } from "@/lib/auth/require-user";

export const metadata = { title: "Projects" };

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ discipline?: string }>;
}) {
  const { supabase } = await requireUser();
  const params = await searchParams;

  let query = supabase
    .from("projects")
    .select("id, title, repo_name, description, discipline, project_type, tech_stack, user_id, created_at")
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(60);

  if (params.discipline) query = query.eq("discipline", params.discipline);

  const { data: projects, error } = await query;
  if (error) {
    return (
      <WorkspaceMessage
        title="Projects could not be loaded."
        message="Apply the latest Supabase migrations and try again."
      />
    );
  }

  return (
    <div className="workspace-page">
      <div className="discovery-heading">
        <div>
          <p className="workspace-eyebrow">Explore / Projects</p>
          <h1>What KSU engineers are building.</h1>
        </div>
        <Link className="workspace-button" href="/projects/new">Add project</Link>
      </div>

      {projects?.length ? (
        <div className="project-grid">
          {projects.map((project) => (
            <Link className="project-card" href={`/projects/${project.id}`} key={project.id}>
              <p className="project-card-meta">{project.discipline || "Engineering"} · {project.project_type || "Project"}</p>
              <h2>{project.title || project.repo_name}</h2>
              <p>{project.description || "Explore this engineering project."}</p>
              {project.tech_stack?.length > 0 && (
                <ul className="tag-list">
                  {project.tech_stack.slice(0, 5).map((tech) => <li key={tech}>{tech}</li>)}
                </ul>
              )}
            </Link>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h2>No public projects yet.</h2>
          <p>Be the first to share something you have built.</p>
          <Link className="workspace-button" href="/projects/new">Add a project</Link>
        </div>
      )}
    </div>
  );
}

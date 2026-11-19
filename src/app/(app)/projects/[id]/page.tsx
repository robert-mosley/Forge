import Link from "next/link";
import { notFound } from "next/navigation";
import { WorkspaceMessage } from "@/components/app/workspace-message";
import { requireUser } from "@/lib/auth/require-user";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { supabase } = await requireUser();
  const { id } = await params;

  const { data: project, error } = await supabase
    .from("projects")
    .select("id, user_id, title, repo_name, description, technical_overview, discipline, project_type, student_role, contributions, outcomes, tech_stack, github_url, is_public, seeking_collaborators, collaboration_roles, post_summary, created_at")
    .eq("id", id)
    .eq("is_public", true)
    .maybeSingle();

  if (error) {
    return <WorkspaceMessage title="Project unavailable." message="This project could not be loaded." />;
  }
  if (!project) notFound();

  const [{ data: owner }, { data: evidence }] = await Promise.all([
    supabase
      .from("profiles")
      .select("username, full_name, major, profile_picture_url")
      .eq("id", project.user_id)
      .maybeSingle(),
    supabase
      .from("project_evidence")
      .select("id, title, file_name, file_type, file_url, kind")
      .eq("project_id", project.id)
      .order("created_at", { ascending: false }),
  ]);

  const evidenceItems = evidence ?? [];

  return (
    <article className="project-detail">
      <header>
        <p className="workspace-eyebrow">{project.discipline || "Engineering"} / {project.project_type || "Project"}</p>
        <h1>{project.title || project.repo_name}</h1>
        {owner && (
          <Link className="project-owner" href={`/students/${owner.username}`}>
            Built by {owner.full_name || owner.username} · {owner.major || "KSU engineering"}
          </Link>
        )}
      </header>

      {project.post_summary && (
        <section>
          <p className="workspace-eyebrow">Team post</p>
          <p className="project-detail-copy">{project.post_summary}</p>
        </section>
      )}

      {project.seeking_collaborators && (
        <section>
          <p className="workspace-eyebrow">Looking for teammates</p>
          {project.collaboration_roles?.length > 0 ? (
            <ul className="tag-list">
              {project.collaboration_roles.map((role) => <li key={role}>{role}</li>)}
            </ul>
          ) : (
            <p className="project-detail-copy">Open to interested KSU collaborators.</p>
          )}
        </section>
      )}

      {(project.description || project.technical_overview) && (
        <section>
          <p className="workspace-eyebrow">Overview</p>
          <p className="project-detail-copy">{project.description || project.technical_overview}</p>
        </section>
      )}

      {project.student_role && (
        <section>
          <p className="workspace-eyebrow">Role</p>
          <p className="project-detail-copy">{project.student_role}</p>
        </section>
      )}

      {project.contributions && (
        <section>
          <p className="workspace-eyebrow">Individual contributions</p>
          <p className="project-detail-copy">{project.contributions}</p>
        </section>
      )}

      {project.outcomes && (
        <section>
          <p className="workspace-eyebrow">Outcomes</p>
          <p className="project-detail-copy">{project.outcomes}</p>
        </section>
      )}

      {project.tech_stack?.length > 0 && (
        <section>
          <p className="workspace-eyebrow">Tools and skills</p>
          <ul className="tag-list">
            {project.tech_stack.map((tech) => <li key={tech}>{tech}</li>)}
          </ul>
        </section>
      )}

      {evidenceItems.length > 0 && (
        <section>
          <p className="workspace-eyebrow">Evidence</p>
          <div className="evidence-grid">
            {evidenceItems.map((item) => (
              <a href={item.file_url} target="_blank" rel="noreferrer" key={item.id}>
                <span>{item.kind}</span>
                <strong>{item.title || item.file_name}</strong>
                <small>Open file ↗</small>
              </a>
            ))}
          </div>
        </section>
      )}

      {project.github_url && (
        <a className="workspace-button" href={project.github_url} target="_blank" rel="noreferrer">
          View repository ↗
        </a>
      )}
    </article>
  );
}

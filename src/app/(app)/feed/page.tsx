import Link from "next/link";
import { requireUser } from "@/lib/auth/require-user";
import { getProjectFeedMatches, getStudentMatches } from "@/services/matching.service";
import { toggleProjectAction } from "@/app/(app)/feed-actions";
import ForgeAIChat from "@/app/(app)/feed/ai-chat";

export const metadata = { title: "Forge feed" };

export default async function FeedPage() {
  const { supabase, user } = await requireUser();
  const [projects, students] = await Promise.all([
    getProjectFeedMatches(supabase, user.id, 30),
    getStudentMatches(supabase, user.id, 6),
  ]);

  const projectIds = projects.map((project) => project.id);
  const [{ data: actions }, { data: evidence }] = await Promise.all([
    projectIds.length
      ? supabase
          .from("project_feed_actions")
          .select("project_id, action, user_id")
          .in("project_id", projectIds)
      : Promise.resolve({ data: [] }),
    projectIds.length
      ? supabase
          .from("project_evidence")
          .select("project_id, title, file_name, file_type, file_url")
          .in("project_id", projectIds)
      : Promise.resolve({ data: [] }),
  ]);

  const actionSet = new Set(
    (actions ?? [])
      .filter((action) => action.user_id === user.id)
      .map((action) => `${action.project_id}:${action.action}`),
  );

  const actionCounts = new Map<string, number>();
  for (const action of actions ?? []) {
    actionCounts.set(action.project_id, (actionCounts.get(action.project_id) ?? 0) + 1);
  }

  const evidenceByProject = new Map<string, typeof evidence>();
  for (const item of evidence ?? []) {
    evidenceByProject.set(item.project_id, [
      ...(evidenceByProject.get(item.project_id) ?? []),
      item,
    ]);
  }

  return (
    <div className="workspace-page feed-page">
      <header className="feed-heading">
        <div>
          <p className="workspace-eyebrow">Matched for you</p>
          <h1>Your Forge feed.</h1>
        </div>
        <Link className="workspace-button" href="/projects/new">Post a project</Link>
      </header>

      <div className="feed-layout">
        <main className="feed-main">
          <ForgeAIChat />
          {projects.length ? projects.map((project) => (
            <article className="feed-card" key={project.id}>
              <div className="feed-card-owner">
                {project.owner?.profile_picture_url ? (
                  // eslint-disable-next-next-line @next/next/no-img-element
                  <img src={project.owner.profile_picture_url} alt="" />
                ) : (
                  <span>{(project.owner?.full_name || project.owner?.username || "S").slice(0, 1).toUpperCase()}</span>
                )}
                <div>
                  <Link href={`/students/${project.owner?.username}`}>
                    {project.owner?.full_name || project.owner?.username || "KSU student"}
                  </Link>
                  <p>{project.discipline || "Engineering"} · Match {project.score}%</p>
                </div>
              </div>

              <Link className="feed-card-link" href={`/projects/${project.id}`}>
                <p className="feed-card-type">{project.project_type || "Project"}</p>
                <h2>{project.title}</h2>
                <p>{project.post_summary || project.description || "Explore this engineering project."}</p>
              </Link>

              {(evidenceByProject.get(project.id)?.length ?? 0) > 0 && (
                <div className="feed-evidence">
                  {(evidenceByProject.get(project.id) ?? []).slice(0, 3).map((item) => (
                    item.file_type?.startsWith("image/") ? (
                      <a href={item.file_url} target="_blank" rel="noreferrer" key={item.file_name}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={item.file_url} alt={item.title || item.file_name} />
                      </a>
                    ) : (
                      <a className="feed-evidence-file" href={item.file_url} target="_blank" rel="noreferrer" key={item.file_name}>
                        <span>Document</span>
                        <strong>{item.title || item.file_name}</strong>
                      </a>
                    )
                  ))}
                </div>
              )}

              {project.tech_stack?.length > 0 && (
                <ul className="tag-list">
                  {project.tech_stack.slice(0, 8).map((tech) => <li key={tech}>{tech}</li>)}
                </ul>
              )}

              {project.seeking_collaborators && (
                <div className="feed-collaboration">
                  <strong>Teammates wanted</strong>
                  {project.collaboration_roles?.length > 0 && (
                    <span>{project.collaboration_roles.join(" · ")}</span>
                  )}
                </div>
              )}

              <div className="feed-actions">
                {(["like", "save", "interest"] as const).map((action) => (
                  <form action={toggleProjectAction} key={action}>
                    <input name="project_id" type="hidden" value={project.id} />
                    <input name="action" type="hidden" value={action} />
                    <button
                      className={actionSet.has(`${project.id}:${action}`) ? "active" : ""}
                      type="submit"
                    >
                      {action === "like" ? "Like" : action === "save" ? "Save" : "I’m interested"}
                    </button>
                  </form>
                ))}
              </div>

              <div className="feed-card-stats">
                {actionCounts.get(project.id) ?? 0} actions
              </div>
            </article>
          )) : (
            <div className="empty-state">
              <h2>Your feed is ready to grow.</h2>
              <p>Post a project or update your interests and skills to improve matches.</p>
              <Link className="workspace-button" href="/projects/new">Post a project</Link>
            </div>
          )}
        </main>

        <aside className="feed-sidebar">
          <p className="workspace-eyebrow">People to meet</p>
          <h2>Best matches</h2>
          {students.map((student) => (
            <Link className="feed-match" href={`/students/${student.username}`} key={student.id}>
              {student.profile_picture_url ? (
                // eslint-disable-next-next-line @next/next/no-img-element
                <img src={student.profile_picture_url} alt="" />
              ) : (
                <span>{(student.full_name || student.username || "S").slice(0, 1).toUpperCase()}</span>
              )}
              <div>
                <strong>{student.full_name || student.username}</strong>
                <p>{student.major || "Engineering"} · {student.score}% match</p>
                {(student.sharedInterests.length > 0 || student.complementarySkills.length > 0) && (
                  <small>
                    {[...student.sharedInterests.slice(0, 2), ...student.complementarySkills.slice(0, 2)].join(" · ")}
                  </small>
                )}
              </div>
            </Link>
          ))}
        </aside>
      </div>
    </div>
  );
}

import Link from "next/link";
import Image from "next/image";
import { WorkspaceMessage } from "@/components/app/workspace-message";
import { requireUser } from "@/lib/auth/require-user";
import { isProfileComplete } from "@/schemas/profile.schema";
import {
  getProfileBundle,
  ProfileServiceError,
} from "@/services/profile.service";

export const metadata = { title: "Workspace" };

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const { supabase, user } = await requireUser();
  let bundle;

  try {
    bundle = await getProfileBundle(supabase, user.id);
  } catch (error) {
    return (
      <WorkspaceMessage
        title="KSUForge needs its database setup."
        message={
          error instanceof ProfileServiceError
            ? error.message
            : "Profile data could not be loaded. Apply the Supabase migrations and try again."
        }
        actionHref="/profile/setup"
        actionLabel="Try profile setup"
      />
    );
  }

  if (!isProfileComplete(bundle.profile, bundle.selectedSkills.length)) {
    const params = await searchParams;
    if (params.notice === "signout-failed") {
      return (
        <WorkspaceMessage
          title="Sign out did not finish."
          message="Your session is still active. Try signing out again."
        />
      );
    }
    const firstName = bundle.profile?.full_name?.split(" ")[0];
    return (
      <WorkspaceMessage
        title={`Welcome${firstName ? `, ${firstName}` : ""}.`}
        message="Finish your profile to make it easier for other KSU students to understand your interests and skills."
        actionHref="/profile/setup"
        actionLabel="Continue profile setup"
      />
    );
  }

  const params = await searchParams;
  const firstName = bundle.profile?.full_name?.split(" ")[0] ?? "there";

  const [{ data: ownProjects }, { data: recentProjects }, { data: recommendedStudents }] = await Promise.all([
    supabase.from("projects").select("id").eq("user_id", user.id).eq("is_public", true),
    supabase
      .from("projects")
      .select("id, title, repo_name, description, discipline, project_type")
      .eq("is_public", true)
      .neq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(3),
    supabase
      .from("profiles")
      .select("id, username, full_name, major, campus, profile_picture_url, interests")
      .eq("is_discoverable", true)
      .neq("id", user.id)
      .limit(3),
  ]);

  return (
    <div className="workspace-page">
      {params.notice === "signout-failed" && (
        <p className="workspace-alert" role="alert">
          Sign out did not finish. Your session is still active; try again.
        </p>
      )}
      <p className="workspace-eyebrow">Home / Today</p>
      <h1>Welcome, {firstName}.</h1>
      <p className="workspace-lede">
        Turn the work you are doing into a portfolio and find students with complementary strengths.
      </p>

      <section className="dashboard-actions">
        <Link href={ownProjects?.length ? "/projects/new" : "/projects/new?from=setup"}>
          <span>01 / Portfolio</span>
          <strong>{ownProjects?.length ? "Add another project" : "Add your first project"}</strong>
        </Link>
        <Link href="/feed">
          <span>02 / Matching feed</span>
          <strong>Find projects and teammates</strong>
        </Link>
        <Link href="/profile?edit=1">
          <span>03 / Profile</span>
          <strong>Update your strengths</strong>
        </Link>
      </section>

      <section className="dashboard-section">
        <div className="dashboard-section-heading">
          <div><p className="workspace-eyebrow">Across KSU</p><h2>Recent projects</h2></div>
          <Link href="/projects">Explore all</Link>
        </div>
        {recentProjects?.length ? (
          <div className="project-grid">
            {recentProjects.map((project) => (
              <Link className="project-card" href={`/projects/${project.id}`} key={project.id}>
                <p className="project-card-meta">{project.discipline || "Engineering"} · {project.project_type || "Project"}</p>
                <h2>{project.title || project.repo_name}</h2>
                <p>{project.description || "Explore this engineering project."}</p>
              </Link>
            ))}
          </div>
        ) : <p className="empty-inline">No public projects have been shared yet.</p>}
      </section>

      <section className="dashboard-section">
        <div className="dashboard-section-heading">
          <div><p className="workspace-eyebrow">People to meet</p><h2>Suggested students</h2></div>
          <Link href="/discover">Open discovery</Link>
        </div>
        {recommendedStudents?.length ? (
          <div className="student-grid">
            {recommendedStudents.map((student) => (
              <Link className="student-card" href={`/students/${student.username}`} key={student.id}>
                {student.profile_picture_url ? (
                  <Image
                    className="student-card-image"
                    src={student.profile_picture_url}
                    alt={`${student.full_name || student.username || "Student"} profile picture`}
                    width={64}
                    height={64}
                  />
                ) : (
                  <span className="student-avatar" aria-hidden="true">{(student.full_name || student.username || "S").slice(0, 1).toUpperCase()}</span>
                )}
                <h2>{student.full_name || student.username}</h2>
                <p>{student.major || "Engineering student"}</p>
              </Link>
            ))}
          </div>
        ) : <p className="empty-inline">New student profiles will appear here as they join.</p>}
      </section>
    </div>
  );
}

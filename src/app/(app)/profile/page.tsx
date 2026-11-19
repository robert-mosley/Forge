import Link from "next/link";
import { redirect } from "next/navigation";
import { WorkspaceMessage } from "@/components/app/workspace-message";
import { EngineeringProfileForm } from "@/components/profile/engineering-profile-form";
import { requireUser } from "@/lib/auth/require-user";
import { isProfileComplete } from "@/schemas/profile.schema";
import {
  getProfileBundle,
  ProfileServiceError,
} from "@/services/profile.service";

export const metadata = { title: "My profile" };

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ updated?: string; edit?: string; imported?: string }>;
}) {
  const { supabase, user } = await requireUser();

  try {
    const bundle = await getProfileBundle(supabase, user.id);

    if (!isProfileComplete(bundle.profile, bundle.selectedSkills.length)) {
      redirect("/profile/setup");
    }

    const params = await searchParams;

    const { data: projects, error: projectError } = await supabase
      .from("projects")
      .select(
        "id, title, repo_name, github_url, description, technical_overview, discipline, project_type, student_role, contributions, outcomes, tech_stack, processing_status, created_at"
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (projectError) {
      throw new ProfileServiceError(
        "Your portfolio projects could not be loaded."
      );
    }

    if (params.edit === "1") {
      return (
        <div className="workspace-page workspace-form-page">
          <p className="workspace-eyebrow">Edit portfolio / KSU</p>
          <h1>Make your strengths visible.</h1>
          {params.updated === "1" && (
            <p className="workspace-success" role="status">
              Your profile has been updated.
            </p>
          )}
          {params.imported === "1" && (
            <p className="workspace-success" role="status">
              GitHub portfolio imported. Review and save any profile field updates.
            </p>
          )}
          <EngineeringProfileForm
            initialProfile={bundle.profile}
            skills={bundle.skills}
            selectedSkills={bundle.selectedSkills}
            mode="edit"
          />
        </div>
      );
    }

    const skillNames = bundle.selectedSkills
      .map((selected) =>
        bundle.skills.find((skill) => skill.id === selected.skill_id)
          ?.canonical_name
      )
      .filter((name): name is string => Boolean(name));

    const portfolioProjects = projects ?? [];
    const profileInterests = bundle.profile?.interests ?? [];

    return (
      <article className="portfolio-page">
        <header className="portfolio-header">
          <div>
            <p className="workspace-eyebrow">Student portfolio / KSU</p>
            {bundle.profile?.profile_picture_url && (
              // eslint-disable-next-next-line @next/next/no-img-element
              <img
                className="student-profile-picture"
                src={bundle.profile.profile_picture_url}
                alt=""
              />
            )}
            <h1>{bundle.profile?.full_name || bundle.profile?.username}</h1>
            {bundle.profile?.major && (
              <p className="portfolio-headline">
                {bundle.profile.major}
                {bundle.profile.academic_year ? ` · ${bundle.profile.academic_year}` : ""}
                {bundle.profile.campus ? ` · ${bundle.profile.campus}` : ""}
              </p>
            )}
            {bundle.profile?.bio && (
              <p className="portfolio-summary">{bundle.profile.bio}</p>
            )}
          </div>
          <div className="portfolio-actions">
            {(bundle.profile?.github_url || bundle.profile?.github_username) && (
              <a
                className="workspace-button"
                href={bundle.profile.github_url || `https://github.com/${bundle.profile.github_username}`}
                rel="noreferrer"
                target="_blank"
              >
                GitHub ↗
              </a>
            )}
            <Link className="portfolio-edit-link" href="/profile?edit=1">
              Edit portfolio
            </Link>
          </div>
        </header>

        {profileInterests.length > 0 && (
          <section className="portfolio-section">
            <p className="workspace-eyebrow">Interests</p>
            <h2>Areas I am exploring</h2>
            <ul className="portfolio-skill-list">
              {profileInterests.map((interest) => (
                <li key={interest}>{interest}</li>
              ))}
            </ul>
          </section>
        )}

        {skillNames.length > 0 && (
          <section
            className="portfolio-section"
            aria-labelledby="portfolio-skills-title"
          >
            <p className="workspace-eyebrow">Skills</p>
            <h2 id="portfolio-skills-title">What I work with</h2>
            <ul className="portfolio-skill-list">
              {skillNames.map((skill) => (
                <li key={skill}>{skill}</li>
              ))}
            </ul>
          </section>
        )}

        <section
          className="portfolio-section"
          aria-labelledby="portfolio-projects-title"
        >
          <p className="workspace-eyebrow">Selected work</p>
          <h2 id="portfolio-projects-title">Projects</h2>
          {portfolioProjects.length === 0 ? (
            <p className="portfolio-empty">
              Share your engineering projects here. GitHub is optional; you can add
              work manually.
            </p>
          ) : (
            <div className="portfolio-project-grid">
              {portfolioProjects.map((project) => (
                <Link className="portfolio-project" href={`/projects/${project.id}`} key={project.id}>
                  <p className="portfolio-project-status">
                    {project.discipline || project.project_type || project.processing_status}
                  </p>
                  <h3>{project.title || project.repo_name}</h3>
                  {project.description && <p>{project.description}</p>}
                  {project.technical_overview && <p>{project.technical_overview}</p>}
                  {project.tech_stack.length > 0 && (
                    <ul className="portfolio-tech-list">
                      {project.tech_stack.slice(0, 8).map((technology) => (
                        <li key={technology}>{technology}</li>
                      ))}
                    </ul>
                  )}
                  {project.github_url && (
                    <a
                      href={project.github_url}
                      rel="noreferrer"
                      target="_blank"
                    >
                      View repository ↗
                    </a>
                  )}
                </Link>
              ))}
            </div>
          )}
        </section>
      </article>
    );
  } catch (error) {
    void error;
    redirect("/profile/setup");
  }
}

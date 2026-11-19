import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";

export default async function StudentProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { supabase } = await requireUser();
  const { username } = await params;

  const { data: student, error } = await supabase
    .from("profiles")
    .select("id, username, full_name, major, campus, academic_year, bio, github_username, github_url, profile_picture_url, interests, show_availability, is_discoverable")
    .eq("username", username)
    .eq("is_discoverable", true)
    .maybeSingle();

  if (error) throw error;
  if (!student) notFound();

  const [{ data: studentSkills }, { data: projects }, { data: availability }, { data: courses }] = await Promise.all([
    supabase
      .from("student_skills")
      .select("skill_id, proficiency, source")
      .eq("user_id", student.id),
    supabase
      .from("projects")
      .select("id, title, repo_name, description, discipline, project_type, tech_stack, created_at")
      .eq("user_id", student.id)
      .eq("is_public", true)
      .order("created_at", { ascending: false }),
    student.show_availability
      ? supabase.from("availability").select("day_of_week, start_time, end_time, campus").eq("user_id", student.id)
      : { data: [] },
    supabase.from("student_courses").select("course_code, semester").eq("user_id", student.id),
  ]);

  const skillIds = [...new Set((studentSkills ?? []).map((row) => row.skill_id))];
  const { data: skills } = skillIds.length
    ? await supabase.from("skills").select("id, canonical_name").in("id", skillIds)
    : { data: [] };
  const skillNameById = new Map((skills ?? []).map((skill) => [skill.id, skill.canonical_name]));

  const githubUrl = student.github_url || (student.github_username ? `https://github.com/${student.github_username}` : null);

  return (
    <article className="portfolio-page">
      <header className="portfolio-header">
        <div>
          <p className="workspace-eyebrow">Student portfolio / KSU</p>
          {student.profile_picture_url ? (
            // eslint-disable-next-next-line @next/next/no-img-element
            <img className="student-profile-picture" src={student.profile_picture_url} alt="" />
          ) : null}
          <h1>{student.full_name || student.username}</h1>
          <p className="portfolio-headline">
            {student.major || "Engineering student"}{student.academic_year ? ` · ${student.academic_year}` : ""}{student.campus ? ` · ${student.campus}` : ""}
          </p>
          {student.bio && <p className="portfolio-summary">{student.bio}</p>}
        </div>

        <div className="portfolio-actions">
          {githubUrl && <a className="workspace-button" href={githubUrl} target="_blank" rel="noreferrer">GitHub ↗</a>}
        </div>
      </header>

      {student.interests?.length > 0 && (
        <section className="portfolio-section">
          <p className="workspace-eyebrow">Interests</p>
          <ul className="portfolio-skill-list">
            {student.interests.map((interest) => <li key={interest}>{interest}</li>)}
          </ul>
        </section>
      )}

      {(studentSkills?.length ?? 0) > 0 && (
        <section className="portfolio-section">
          <p className="workspace-eyebrow">Skills</p>
          <h2>What they work with</h2>
          <ul className="portfolio-skill-list">
            {[...new Map((studentSkills ?? []).map((skill) => [skill.skill_id, skill])).values()].map((skill) => (
              <li key={skill.skill_id}>{skillNameById.get(skill.skill_id) || "Skill"} · {skill.source}</li>
            ))}
          </ul>
        </section>
      )}

      <section className="portfolio-section">
        <p className="workspace-eyebrow">Selected work</p>
        <h2>Projects</h2>
        {projects?.length ? (
          <div className="portfolio-project-grid">
            {projects.map((project) => (
              <Link className="portfolio-project" href={`/projects/${project.id}`} key={project.id}>
                <p className="portfolio-project-status">{project.discipline || project.project_type || "Project"}</p>
                <h3>{project.title || project.repo_name}</h3>
                {project.description && <p>{project.description}</p>}
                {project.tech_stack?.length > 0 && (
                  <ul className="portfolio-tech-list">
                    {project.tech_stack.slice(0, 8).map((tech) => <li key={tech}>{tech}</li>)}
                  </ul>
                )}
              </Link>
            ))}
          </div>
        ) : (
          <p className="portfolio-empty">This student has not added any public projects yet.</p>
        )}
      </section>

      {(courses?.length ?? 0) > 0 && (
        <section className="portfolio-section">
          <p className="workspace-eyebrow">Courses</p>
          <ul className="portfolio-skill-list">
            {courses?.map((course) => <li key={`${course.course_code}-${course.semester}`}>{course.course_code} · {course.semester}</li>)}
          </ul>
        </section>
      )}

      {student.show_availability && (availability?.length ?? 0) > 0 && (
        <section className="portfolio-section">
          <p className="workspace-eyebrow">Collaboration availability</p>
          <ul className="portfolio-skill-list">
            {availability?.map((slot, index) => (
              <li key={index}>{["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][slot.day_of_week]} · {slot.start_time}–{slot.end_time}</li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}

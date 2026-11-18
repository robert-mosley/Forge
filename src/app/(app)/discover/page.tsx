import Link from "next/link";
import { requireUser } from "@/lib/auth/require-user";

export const metadata = { title: "Discover students" };

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; major?: string; campus?: string }>;
}) {
  const { supabase, user } = await requireUser();
  const params = await searchParams;

  let query = supabase
    .from("profiles")
    .select("id, username, full_name, major, campus, academic_year, bio, profile_picture_url, interests")
    .eq("is_discoverable", true)
    .neq("id", user.id)
    .limit(60);

  if (params.major) query = query.ilike("major", `%${params.major}%`);
  if (params.campus) query = query.ilike("campus", `%${params.campus}%`);
  if (params.q) {
    query = query.or(`full_name.ilike.%${params.q}%,username.ilike.%${params.q}%`);
  }

  const { data: students, error } = await query;

  const studentIds = (students ?? []).map((student) => student.id);
  const { data: studentSkills } = studentIds.length
    ? await supabase
        .from("student_skills")
        .select("user_id, skill_id, source")
        .in("user_id", studentIds)
    : { data: [] };

  const skillIds = [...new Set((studentSkills ?? []).map((row) => row.skill_id))];
  const { data: skillCatalog } = skillIds.length
    ? await supabase.from("skills").select("id, canonical_name").in("id", skillIds)
    : { data: [] };

  const namesById = new Map((skillCatalog ?? []).map((skill) => [skill.id, skill.canonical_name]));
  const skillsByUser = new Map<string, string[]>();
  for (const row of studentSkills ?? []) {
    const name = namesById.get(row.skill_id);
    if (name) skillsByUser.set(row.user_id, [...(skillsByUser.get(row.user_id) ?? []), name]);
  }

  return (
    <div className="workspace-page">
      <div className="discovery-heading">
        <div>
          <p className="workspace-eyebrow">Discover / KSU engineers</p>
          <h1>Find a complementary builder.</h1>
        </div>
      </div>

      <form className="discovery-search" method="get">
        <label>
          <span>Search</span>
          <input name="q" defaultValue={params.q ?? ""} placeholder="Name or username" />
        </label>
        <label>
          <span>Major</span>
          <input name="major" defaultValue={params.major ?? ""} placeholder="Mechanical engineering" />
        </label>
        <label>
          <span>Campus</span>
          <input name="campus" defaultValue={params.campus ?? ""} placeholder="Marietta or Kennesaw" />
        </label>
        <button className="workspace-button" type="submit">Search</button>
      </form>

      {error ? (
        <p className="form-error" role="alert">Students could not be loaded. Apply the latest migrations and try again.</p>
      ) : students?.length ? (
        <div className="student-grid">
          {students.map((student) => {
            const skillNames = [...new Set(skillsByUser.get(student.id) ?? [])].slice(0, 6);
            return (
              <Link className="student-card" href={`/students/${student.username}`} key={student.id}>
                <div className="student-card-top">
                  {student.profile_picture_url ? (
                    // eslint-disable-next-next-line @next/next/no-img-element
                    <img src={student.profile_picture_url} alt="" />
                  ) : (
                    <span className="student-avatar" aria-hidden="true">
                      {(student.full_name || student.username || "S").slice(0, 1).toUpperCase()}
                    </span>
                  )}
                </div>
                <h2>{student.full_name || student.username}</h2>
                <p>{student.major || "Engineering student"}</p>
                {student.academic_year && <small>{student.academic_year} · {student.campus}</small>}
                {skillNames.length > 0 && (
                  <ul className="tag-list">
                    {skillNames.map((skill) => <li key={skill}>{skill}</li>)}
                  </ul>
                )}
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">
          <h2>No students match this search.</h2>
          <p>Try another major, campus, or name.</p>
        </div>
      )}
    </div>
  );
}

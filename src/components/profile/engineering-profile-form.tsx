"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { GitHubPortfolioImport } from "@/components/profile/github-portfolio-import";
import { saveProfileAction } from "@/app/(app)/profile-actions";
import { initialFormActionState } from "@/lib/forms";
import type { ProfileRow, Proficiency, SkillRow, StudentSkillRow } from "@/types/database";

const proficiencyOptions: { value: Proficiency; label: string }[] = [
  { value: "beginner", label: "Learning" },
  { value: "intermediate", label: "Comfortable" },
  { value: "advanced", label: "Experienced" },
  { value: "expert", label: "Highly experienced" },
];

const majors = [
  "Mechanical Engineering", "Electrical Engineering", "Civil Engineering",
  "Computer Engineering", "Software Engineering", "Aerospace Engineering",
  "Biomedical Engineering", "Mechatronics", "Industrial Engineering",
  "Environmental Engineering", "Computer Science", "Other Engineering",
];

const academicYears = ["First year", "Second year", "Third year", "Fourth year", "Graduate", "Alumni"];
const interests = [
  "Robotics", "CAD and design", "PCB and embedded systems", "Computer vision",
  "Structures", "Sustainability", "Renewable energy", "Aerospace", "Research",
  "AI and machine learning", "Manufacturing", "Product development",
];

export function EngineeringProfileForm({
  initialProfile,
  skills,
  selectedSkills,
  mode,
}: {
  initialProfile: ProfileRow | null;
  skills: SkillRow[];
  selectedSkills: StudentSkillRow[];
  mode: "setup" | "edit";
}) {
  const [state, formAction, pending] = useActionState(saveProfileAction, initialFormActionState);
  const selectedById = new Map(selectedSkills.map((skill) => [skill.skill_id, skill.proficiency]));

  return (
    <form action={formAction} className="profile-form engineering-profile-form">
      <section className="onboarding-section">
        <p className="workspace-eyebrow">1 / Identity</p>
        <h2>Tell people who you are.</h2>
        <div className="profile-form-grid">
          {initialProfile?.profile_picture_url && (
            // eslint-disable-next-next-line @next/next/no-img-element
            <img className="profile-picture-preview" src={initialProfile.profile_picture_url} alt="Current profile" />
          )}
          <label className="form-field">
            <span>Profile picture <em>Optional</em></span>
            <input name="profile_picture" type="file" accept="image/png,image/jpeg,image/webp" />
            <small>PNG, JPG, or WebP. Maximum 5 MB.</small>
          </label>
          <label className="form-field">
            <span>Full name</span>
            <input name="full_name" autoComplete="name" maxLength={80} defaultValue={initialProfile?.full_name ?? ""} required />
          </label>
          <label className="form-field">
            <span>Username</span>
            <input name="username" autoCapitalize="none" maxLength={24} minLength={3} pattern="[A-Za-z0-9_]+" defaultValue={initialProfile?.username ?? ""} placeholder="your_handle" required />
          </label>
          <label className="form-field">
            <span>Engineering major</span>
            <input name="major" list="engineering-majors" maxLength={100} defaultValue={initialProfile?.major ?? ""} placeholder="Mechanical engineering" required />
            <datalist id="engineering-majors">
              {majors.map((major) => <option value={major} key={major} />)}
            </datalist>
          </label>
          <label className="form-field">
            <span>Academic year <em>Optional</em></span>
            <select name="academic_year" defaultValue={initialProfile?.academic_year ?? ""}>
              <option value="">Prefer not to say</option>
              {academicYears.map((year) => <option value={year} key={year}>{year}</option>)}
            </select>
          </label>
          <label className="form-field">
            <span>Campus</span>
            <input name="campus" maxLength={80} defaultValue={initialProfile?.campus ?? ""} placeholder="Marietta or Kennesaw" required />
          </label>
        </div>
      </section>

      <section className="onboarding-section">
        <p className="workspace-eyebrow">2 / Direction</p>
        <h2>What interests you?</h2>
        <label className="form-field form-field-wide">
          <span>Short introduction <em>Optional</em></span>
          <textarea name="bio" maxLength={280} rows={4} defaultValue={initialProfile?.bio ?? ""} placeholder="What kind of problems do you want to solve?" />
        </label>
        <fieldset className="interest-fieldset">
          <legend>Areas of interest <em>Optional</em></legend>
          <div className="interest-grid">
            {interests.map((interest) => (
              <label className="interest-choice" key={interest}>
                <input name="interest" type="checkbox" value={interest} defaultChecked={initialProfile?.interests?.includes(interest)} />
                <span>{interest}</span>
              </label>
            ))}
          </div>
        </fieldset>
      </section>

      <section className="onboarding-section">
        <p className="workspace-eyebrow">3 / Skills and links</p>
        <h2>Choose what you can contribute.</h2>
        {mode === "edit" && (
          <GitHubPortfolioImport
            githubUsername={initialProfile?.github_username ?? null}
            mode="edit"
          />
        )}
        {skills.length > 0 && (
          <fieldset className="skills-fieldset">
            <legend>Skills <em>Optional</em></legend>
            <div className="skill-list">
              {skills.map((skill) => (
                <div className="skill-row" key={skill.id}>
                  <label className="skill-choice">
                    <input name="skill_id" type="checkbox" value={skill.id} defaultChecked={selectedById.has(skill.id)} />
                    <span>{skill.canonical_name}</span>
                  </label>
                  <label className="skill-proficiency">
                    <span className="sr-only">Proficiency for {skill.canonical_name}</span>
                    <select name={`proficiency:${skill.id}`} defaultValue={selectedById.get(skill.id) ?? "beginner"}>
                      {proficiencyOptions.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}
                    </select>
                  </label>
                </div>
              ))}
            </div>
          </fieldset>
        )}
        <div className="profile-form-grid">
          <label className="form-field">
            <span>GitHub username <em>Optional</em></span>
            <input name="github_username" autoCapitalize="none" maxLength={39} defaultValue={initialProfile?.github_username ?? ""} placeholder="username" />
          </label>
          <label className="form-field">
            <span>GitHub or project URL <em>Optional</em></span>
            <input name="github_url" type="url" defaultValue={initialProfile?.github_url ?? ""} placeholder="https://github.com/username" />
          </label>
        </div>
      </section>

      <section className="onboarding-section">
        <p className="workspace-eyebrow">4 / Privacy</p>
        <h2>Choose what others can discover.</h2>
        <div className="onboarding-check-grid">
          <label className="onboarding-check">
            <input name="is_discoverable" type="checkbox" defaultChecked={initialProfile?.is_discoverable ?? true} />
            <span>Appear in student discovery</span>
          </label>
          <label className="onboarding-check">
            <input name="show_availability" type="checkbox" defaultChecked={initialProfile?.show_availability ?? false} />
            <span>Share collaboration availability</span>
          </label>
        </div>
      </section>

      {state.message && (
        <p className={state.status === "error" ? "form-error" : "form-success"} role="alert">
          {state.message}
        </p>
      )}
      <input name="profile_picture_url" type="hidden" value={initialProfile?.profile_picture_url ?? ""} />
      <input name="return_to" type="hidden" value={mode === "setup" ? "/profile/setup" : "/profile"} />
      <div className="profile-form-footer">
        <p>You can add projects and update these details later.</p>
        <Button disabled={pending} type="submit">
          {pending ? "Saving…" : mode === "setup" ? "Finish basic profile" : "Save profile"}
        </Button>
      </div>
    </form>
  );
}

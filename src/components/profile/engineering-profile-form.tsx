"use client";

import { useActionState, useMemo, useState } from "react";
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
  "Environmental Engineering", "Computer Science", "Information Technology",
  "Data Science", "Mathematics", "Physics", "Chemistry", "Biology",
  "Nursing", "Psychology", "Architecture", "Construction Management",
  "Business", "Finance", "Accounting", "Marketing", "Economics",
  "Education", "Political Science", "Criminal Justice", "Journalism",
  "Digital Media", "Art and Design", "Music", "Theater", "Other",
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

  const [skillQuery, setSkillQuery] = useState("");
  const [selectedSkillState, setSelectedSkillState] = useState(() =>
    selectedSkills
      .map((selected) => {
        const skill = skills.find((item) => item.id === selected.skill_id);
        if (!skill) return null;
        return {
          id: skill.id,
          name: skill.canonical_name,
          proficiency: selected.proficiency,
        };
      })
      .filter((value): value is { id: string; name: string; proficiency: Proficiency } => Boolean(value)),
  );

  const selectedIds = useMemo(
    () => new Set(selectedSkillState.map((skill) => skill.id)),
    [selectedSkillState],
  );

  const filteredSkillSuggestions = useMemo(() => {
    const query = skillQuery.trim().toLowerCase();
    return skills
      .filter((skill) => !selectedIds.has(skill.id))
      .filter((skill) =>
        query.length === 0
          ? false
          : skill.canonical_name.toLowerCase().includes(query),
      )
      .slice(0, 8);
  }, [skills, selectedIds, skillQuery]);

  function addSkill(skill: SkillRow) {
    setSelectedSkillState((previous) => {
      if (previous.some((item) => item.id === skill.id) || previous.length >= 12) {
        return previous;
      }
      return [
        ...previous,
        {
          id: skill.id,
          name: skill.canonical_name,
          proficiency: selectedById.get(skill.id) ?? "beginner",
        },
      ];
    });
    setSkillQuery("");
  }

  function removeSkill(skillId: string) {
    setSelectedSkillState((previous) => previous.filter((item) => item.id !== skillId));
  }

  function updateProficiency(skillId: string, proficiency: Proficiency) {
    setSelectedSkillState((previous) =>
      previous.map((item) =>
        item.id === skillId ? { ...item, proficiency } : item,
      ),
    );
  }

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
            <span>Major or program</span>
            <input name="major" list="ksu-majors" maxLength={100} defaultValue={initialProfile?.major ?? ""} placeholder="Mechanical Engineering, Marketing, Nursing, ..." required />
            <datalist id="ksu-majors">
              {majors.map((major) => <option value={major} key={major} />)}
            </datalist>
            <small>KSUForge is for all KSU majors. Any field is welcome.</small>
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
        <h2>What do you want to build?</h2>
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
        <GitHubPortfolioImport
          githubUsername={initialProfile?.github_username ?? null}
          mode={mode}
        />
        {skills.length > 0 && (
          <fieldset className="skills-fieldset">
            <legend>Skills <em>Optional</em></legend>
            <p>Type a skill, then choose from suggestions. You can add up to 12.</p>
            <label className="form-field skill-search" htmlFor="skill-search-input">
              <span className="sr-only">Search skills</span>
              <input
                id="skill-search-input"
                type="text"
                value={skillQuery}
                onChange={(event) => setSkillQuery(event.target.value)}
                placeholder="Type to find skills..."
                autoComplete="off"
                disabled={selectedSkillState.length >= 12}
              />
            </label>
            {filteredSkillSuggestions.length > 0 && (
              <div className="skill-suggestions" role="listbox" aria-label="Skill suggestions">
                {filteredSkillSuggestions.map((skill) => (
                  <button
                    key={skill.id}
                    type="button"
                    className="skill-suggestion"
                    onClick={() => addSkill(skill)}
                  >
                    {skill.canonical_name}
                  </button>
                ))}
              </div>
            )}
            <div className="skill-list">
              {selectedSkillState.length === 0 && (
                <p className="workspace-alert">No skills selected yet.</p>
              )}
              {selectedSkillState.map((skill) => (
                <div className="skill-row" key={skill.id}>
                  <div className="skill-chip-wrap">
                    <input name="skill_id" type="hidden" value={skill.id} />
                    <span className="skill-chip">{skill.name}</span>
                    <button
                      type="button"
                      className="skill-remove"
                      onClick={() => removeSkill(skill.id)}
                      aria-label={`Remove ${skill.name}`}
                    >
                      Remove
                    </button>
                  </div>
                  <label className="skill-proficiency">
                    <span className="sr-only">Proficiency for {skill.name}</span>
                    <select
                      name={`proficiency:${skill.id}`}
                      value={skill.proficiency}
                      onChange={(event) =>
                        updateProficiency(skill.id, event.target.value as Proficiency)}
                    >
                      {proficiencyOptions.map((option) => (
                        <option value={option.value} key={option.value}>{option.label}</option>
                      ))}
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

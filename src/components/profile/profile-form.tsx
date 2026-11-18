"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { initialFormActionState } from "@/lib/forms";
import { saveProfileAction } from "@/app/(app)/profile-actions";
import { GitHubPortfolioImport } from "@/components/profile/github-portfolio-import";
import type {
  ProfileRow,
  Proficiency,
  SkillRow,
  StudentSkillRow,
} from "@/types/database";

const proficiencyOptions: { value: Proficiency; label: string }[] = [
  { value: "beginner", label: "Learning" },
  { value: "intermediate", label: "Comfortable" },
  { value: "advanced", label: "Experienced" },
  { value: "expert", label: "Highly experienced" },
];

export function ProfileForm({
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
  const [state, formAction, pending] = useActionState(
    saveProfileAction,
    initialFormActionState,
  );
  const selectedById = new Map(
    selectedSkills.map((skill) => [skill.skill_id, skill.proficiency]),
  );

  return (
    <>
      {mode === "setup" && (
        <GitHubPortfolioImport
          githubUsername={initialProfile?.github_username ?? null}
        />
      )}
      <form action={formAction} className="profile-form">
        <div className="profile-form-grid">
          <label className="form-field">
            <span>Full name</span>
            <input
              autoComplete="name"
              defaultValue={initialProfile?.full_name ?? ""}
              maxLength={80}
              name="full_name"
              placeholder="How teammates should address you"
              required
            />
          </label>
          <label className="form-field">
            <span>Username</span>
            <input
              autoCapitalize="none"
              autoComplete="nickname"
              defaultValue={initialProfile?.username ?? ""}
              maxLength={24}
              minLength={3}
              name="username"
              pattern="[A-Za-z0-9_]+"
              placeholder="your_handle"
              required
            />
            <small>Lowercase letters, numbers, and underscores.</small>
          </label>
          <label className="form-field">
            <span>Major</span>
            <input
              autoComplete="organization-title"
              defaultValue={initialProfile?.major ?? ""}
              maxLength={100}
              name="major"
              placeholder="Computer science"
              required
            />
          </label>
          <label className="form-field">
            <span>Campus</span>
            <input
              defaultValue={initialProfile?.campus ?? ""}
              maxLength={80}
              name="campus"
              placeholder="Your KSU campus"
              required
            />
          </label>
          <label className="form-field form-field-wide">
            <span>Short introduction</span>
            <textarea
              defaultValue={initialProfile?.bio ?? ""}
              maxLength={280}
              name="bio"
              placeholder="What kinds of problems or projects do you enjoy?"
              rows={4}
            />
            <small>Up to 280 characters.</small>
          </label>
          <label className="form-field form-field-wide">
            <span>GitHub username <em>Optional</em></span>
            <input
              autoCapitalize="none"
              autoComplete="off"
              defaultValue={initialProfile?.github_username ?? ""}
              maxLength={39}
              name="github_username"
              placeholder="your-github-name"
            />
            <small>Only your username is needed; you can connect repositories later.</small>
          </label>
        </div>

        <fieldset className="skills-fieldset">
          <legend>Skills you want teammates to know about</legend>
          <p>
            Choose 1–12. These are self-reported and can be updated as you build.
          </p>
          {skills.length === 0 ? (
            <p className="workspace-alert" role="alert">
              No starter skills are available yet. Apply the starter-skills
              migration in Supabase, then reload this page.
            </p>
          ) : (
            <div className="skill-list">
              {skills.map((skill) => (
                <div className="skill-row" key={skill.id}>
                  <label className="skill-choice">
                    <input
                      defaultChecked={selectedById.has(skill.id)}
                      name="skill_id"
                      type="checkbox"
                      value={skill.id}
                    />
                    <span>{skill.canonical_name}</span>
                  </label>
                  <label className="skill-proficiency">
                    <span className="sr-only">
                      Proficiency for {skill.canonical_name}
                    </span>
                    <select
                      defaultValue={selectedById.get(skill.id) ?? "beginner"}
                      name={`proficiency:${skill.id}`}
                    >
                      {proficiencyOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              ))}
            </div>
          )}
        </fieldset>

        {state.message && (
          <p
            className={state.status === "error" ? "form-error" : "form-success"}
            role={state.status === "error" ? "alert" : "status"}
          >
            {state.message}
          </p>
        )}
        <input
          name="return_to"
          type="hidden"
          value={mode === "setup" ? "/dashboard" : "/profile"}
        />
        <div className="profile-form-footer">
          <p>Availability and course details are not part of this public profile.</p>
          <Button disabled={pending || skills.length === 0} type="submit">
            {pending
              ? "Saving…"
              : mode === "setup"
                ? "Save and continue"
                : "Save profile"}
          </Button>
        </div>
      </form>
    </>
  );
}

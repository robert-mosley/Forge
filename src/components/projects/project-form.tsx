"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { createProjectAction } from "@/app/(app)/project-actions";
import { initialFormActionState } from "@/lib/forms";

const disciplines = [
  "Computer Engineering", "Mechanical Engineering", "Electrical Engineering",
  "Civil Engineering", "Aerospace Engineering", "Mechatronics", "Industrial Engineering",
  "Environmental Engineering", "Biomedical Engineering", "Software and Computing", "Other",
];

const projectTypes = ["Personal", "Coursework", "Research", "Capstone", "Competition", "Club", "Internship", "Other"];

export function ProjectForm({ returnTo = "/dashboard" }: { returnTo?: string }) {
  const [state, formAction, pending] = useActionState(createProjectAction, initialFormActionState);

  return (
    <form action={formAction} className="project-form">
      <div className="profile-form-grid">
        <label className="form-field form-field-wide">
          <span>Project title</span>
          <input name="title" maxLength={120} placeholder="What did you build or investigate?" required />
        </label>
        <label className="form-field">
          <span>Engineering discipline</span>
          <select name="discipline" required defaultValue="">
            <option value="" disabled>Select discipline</option>
            {disciplines.map((discipline) => <option key={discipline}>{discipline}</option>)}
          </select>
        </label>
        <label className="form-field">
          <span>Project type</span>
          <select name="project_type" required defaultValue="">
            <option value="" disabled>Select type</option>
            {projectTypes.map((type) => <option key={type}>{type}</option>)}
          </select>
        </label>
        <label className="form-field form-field-wide">
          <span>Short description</span>
          <textarea name="description" maxLength={2000} rows={4} placeholder="Summarize the problem, approach, and what was built." />
        </label>
        <label className="form-field">
          <span>Your role <em>Optional</em></span>
          <input name="student_role" maxLength={120} placeholder="Team lead, designer, programmer…" />
        </label>
        <label className="form-field">
          <span>Tools and technologies <em>Optional</em></span>
          <input name="tech_stack" maxLength={300} placeholder="SolidWorks, MATLAB, Arduino, Python" />
          <small>Separate entries with commas.</small>
        </label>
        <label className="form-field form-field-wide">
          <span>Your individual contributions <em>Optional</em></span>
          <textarea name="contributions" maxLength={2000} rows={4} placeholder="Describe the work you personally completed." />
        </label>
        <label className="form-field form-field-wide">
          <span>Outcomes or measurable results <em>Optional</em></span>
          <textarea name="outcomes" maxLength={2000} rows={3} placeholder="Performance, competition placement, testing data, published work…" />
        </label>
        <label className="form-field form-field-wide">
          <span>Feed summary <em>Optional</em></span>
          <textarea name="post_summary" maxLength={500} rows={3} placeholder="Introduce the project to potential teammates in a few sentences." />
        </label>
        <label className="form-field">
          <span>Looking for teammates <em>Optional</em></span>
          <label className="onboarding-check">
            <input name="seeking_collaborators" type="checkbox" />
            <span>Include this project in team matching</span>
          </label>
        </label>
        <label className="form-field">
          <span>Roles needed <em>Optional</em></span>
          <input name="collaboration_roles" maxLength={300} placeholder="Mechanical designer, embedded engineer" />
          <small>Separate roles with commas.</small>
        </label>
        <label className="form-field form-field-wide">
          <span>GitHub repository <em>Optional</em></span>
          <input name="github_url" type="url" placeholder="https://github.com/username/project" />
        </label>
        <label className="form-field form-field-wide">
          <span>Project evidence <em>Optional</em></span>
          <input name="evidence" type="file" multiple accept=".pdf,.png,.jpg,.jpeg,.webp,.ppt,.pptx,.doc,.docx,.dwg,.step,.stl,.svg" />
          <small>Upload reports, CAD screenshots, photos, schematics, presentations, or PDFs.</small>
        </label>
      </div>

      <label className="onboarding-check">
        <input name="is_public" type="checkbox" defaultChecked />
        <span>Show this project on my public KSUForge portfolio</span>
      </label>

      {state.message && (
        <p className={state.status === "error" ? "form-error" : "form-success"} role="alert">
          {state.message}
        </p>
      )}
      <input name="return_to" type="hidden" value={returnTo} />
      <div className="profile-form-footer">
        <p>Evidence is used to support, not infer, proficiency claims.</p>
        <Button disabled={pending} type="submit">
          {pending ? "Saving project…" : "Save project"}
        </Button>
      </div>
    </form>
  );
}

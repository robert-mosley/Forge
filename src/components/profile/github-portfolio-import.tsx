"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { initialFormActionState } from "@/lib/forms";
import { importGitHubPortfolioAction } from "@/app/(app)/profile-actions";

export function GitHubPortfolioImport({
  githubUsername,
  mode = "setup",
}: {
  githubUsername: string | null;
  mode?: "setup" | "edit";
}) {
  const [state, formAction, pending] = useActionState(
    importGitHubPortfolioAction,
    initialFormActionState,
  );

  return (
    <section className="github-import-panel" aria-labelledby="github-import-title">
      <div>
        <p className="workspace-eyebrow">
          {mode === "edit" ? "Refresh from GitHub" : "Start with GitHub"}
        </p>
        <h2 id="github-import-title">
          {mode === "edit"
            ? "Regenerate your portfolio from your latest repositories."
            : "Build a first draft from your work."}
        </h2>
        <p>
          KSUForge will inspect your public repositories, infer the technologies you
          use, and add project evidence to your profile. Built for makers and
          engineers, open to every KSU major.
        </p>
      </div>

      <div className="github-import-form">
        <label className="form-field" htmlFor="github-import-username">
          <span>GitHub username</span>
          <input
            autoCapitalize="none"
            autoComplete="off"
            defaultValue={githubUsername ?? ""}
            id="github-import-username"
            maxLength={39}
            name="github_username"
            placeholder="your-github-name"
            required
          />
        </label>
        <input name="return_to" type="hidden" value={mode === "edit" ? "/profile?edit=1" : "/profile/setup"} />
        {state.message && (
          <p className={state.status === "error" ? "form-error" : "form-success"} role="alert">
            {state.message}
          </p>
        )}
        <Button disabled={pending} formAction={formAction} formNoValidate type="submit">
          {pending ? "Generating portfolio…" : "Generate my portfolio"}
        </Button>
      </div>
    </section>
  );
}

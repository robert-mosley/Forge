"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { initialFormActionState } from "@/lib/forms";
import { importGitHubPortfolioAction } from "@/app/(app)/profile-actions";

export function GitHubPortfolioImport({
  githubUsername,
}: {
  githubUsername: string | null;
}) {
  const [state, formAction, pending] = useActionState(
    importGitHubPortfolioAction,
    initialFormActionState,
  );

  return (
    <section className="github-import-panel" aria-labelledby="github-import-title">
      <div>
        <p className="workspace-eyebrow">Start with GitHub</p>
        <h2 id="github-import-title">Build a first draft from your work.</h2>
        <p>
          Forge will inspect your public repositories, infer the technologies you
          use, and add project evidence to your profile.
        </p>
      </div>

      <form action={formAction} className="github-import-form">
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
        {state.message && (
          <p className={state.status === "error" ? "form-error" : "form-success"} role="alert">
            {state.message}
          </p>
        )}
        <Button disabled={pending} type="submit">
          {pending ? "Generating portfolio…" : "Generate my portfolio"}
        </Button>
      </form>
    </section>
  );
}

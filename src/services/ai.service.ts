import type { GitHubPortfolio } from "@/services/github.service";
import { getBackendUrl } from "@/lib/backend-url";

export class PortfolioBackendError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PortfolioBackendError";
  }
}

export async function generateClaudePortfolio(
  githubUsername: string,
): Promise<GitHubPortfolio> {
  let backendUrl: string;
  try {
    backendUrl = getBackendUrl();
  } catch {
    throw new PortfolioBackendError("FASTAPI_BACKEND_URL is not configured.");
  }

  let response: Response;
  try {
    response = await fetch(`${backendUrl}/portfolio/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ github_username: githubUsername }),
      cache: "no-store",
    });
  } catch {
    throw new PortfolioBackendError(
      "The portfolio backend is not reachable.",
    );
  }

  if (!response.ok) {
    let detail = "The portfolio could not be generated.";
    try {
      const payload = await response.json() as { detail?: string };
      if (payload.detail) detail = payload.detail;
    } catch {
      // Use the stable fallback message.
    }
    throw new PortfolioBackendError(detail);
  }

  const payload = await response.json() as {
    username: string;
    display_name: string | null;
    bio: string | null;
    headline: string;
    profile_summary: string;
    projects: GitHubPortfolio["projects"];
    skills: string[];
  };

  return {
    username: payload.username,
    display_name: payload.display_name,
    bio: payload.bio,
    headline: payload.headline,
    profile_summary: payload.profile_summary,
    projects: payload.projects,
    skills: payload.skills,
  };
}

import type { GitHubPortfolio } from "@/services/github.service";

export class PortfolioBackendError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PortfolioBackendError";
  }
}

export async function generateClaudePortfolio(
  githubUsername: string,
): Promise<GitHubPortfolio> {
  const backendUrl = process.env.FASTAPI_BACKEND_URL?.replace(/\/$/, "") ??
    "http://127.0.0.1:8000";

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
      "The portfolio backend is not reachable. Start FastAPI on port 8000.",
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

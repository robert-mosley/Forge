import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateClaudePortfolio } from "@/services/ai.service";
import { importGitHubPortfolio, PortfolioImportError } from "@/services/portfolio.service";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as {
    github_username?: string;
    return_to?: string;
  } | null;
  const githubUsername = body?.github_username?.trim().replace(/^@/, "") ?? "";
  const returnTo = body?.return_to === "/profile?edit=1"
    ? "/profile?edit=1&imported=1"
    : "/profile/setup?imported=1";

  if (!githubUsername) {
    return NextResponse.json(
      { detail: "Enter a GitHub username." },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json(
      { detail: "You must be signed in to import your portfolio." },
      { status: 401 },
    );
  }

  try {
    const portfolio = await generateClaudePortfolio(githubUsername);
    await importGitHubPortfolio(supabase, user.id, portfolio);

    return NextResponse.json({ redirect_to: returnTo, portfolio }, { status: 200 });
  } catch (error) {
    const detail =
      error instanceof PortfolioImportError || error instanceof Error
        ? error.message
        : "The portfolio could not be generated.";

    return NextResponse.json(
      { detail },
      { status: 500 },
    );
  }
}

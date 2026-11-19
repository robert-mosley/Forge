import { NextResponse, type NextRequest } from "next/server";
import { getBackendUrl } from "@/lib/backend-url";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as { github_username?: string } | null;
  const githubUsername = body?.github_username?.trim().replace(/^@/, "") ?? "";

  if (!githubUsername) {
    return NextResponse.json(
      { detail: "Enter a GitHub username." },
      { status: 400 },
    );
  }

  let backendUrl: string;
  try {
    backendUrl = getBackendUrl();
  } catch {
    return NextResponse.json(
      { detail: "FASTAPI_BACKEND_URL is not configured for this deployment." },
      { status: 503 },
    );
  }

  try {
    const response = await fetch(`${backendUrl}/portfolio/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ github_username: githubUsername }),
      cache: "no-store",
    });

    const payload = await response.json().catch(() => ({ detail: "The backend returned an invalid response." }));

    return NextResponse.json(payload, { status: response.status });
  } catch {
    return NextResponse.json(
      { detail: "The portfolio backend is not reachable." },
      { status: 503 },
    );
  }
}

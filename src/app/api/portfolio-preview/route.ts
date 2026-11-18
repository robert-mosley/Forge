import { NextResponse, type NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as { github_username?: string } | null;
  const githubUsername = body?.github_username?.trim().replace(/^@/, "") ?? "";

  if (!githubUsername) {
    return NextResponse.json(
      { detail: "Enter a GitHub username." },
      { status: 400 },
    );
  }

  const backendUrl = (process.env.FASTAPI_BACKEND_URL ?? "http://127.0.0.1:8000").replace(/\/$/, "");

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
      { detail: "The portfolio backend is not running. Start it on port 8000." },
      { status: 503 },
    );
  }
}

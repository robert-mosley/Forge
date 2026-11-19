import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session) {
    return NextResponse.json({ error: "You must be signed in to use Forge AI." }, { status: 401 });
  }

  const body = await request.json().catch(() => null) as {
    message?: string;
    conversation?: Array<{ role: "user" | "assistant"; content: string }>;
  } | null;

  const message = body?.message?.trim();
  if (!message) {
    return NextResponse.json({ error: "Enter a question or project idea." }, { status: 400 });
  }

  const backendUrl = (process.env.FASTAPI_BACKEND_URL ?? "http://127.0.0.1:8000").replace(/\/$/, "");

  try {
    const response = await fetch(`${backendUrl}/ai/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
        "x-supabase-url": process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
        "x-supabase-anon-key": process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
      },
      body: JSON.stringify({
        message,
        conversation: body?.conversation?.slice(-8) ?? [],
      }),
      cache: "no-store",
    });

    const payload = await response.json().catch(() => ({ error: "The AI service returned an invalid response." }));
    if (!response.ok) {
      return NextResponse.json(
        { error: payload.error ?? payload.detail ?? "The AI service could not complete that search." },
        { status: response.status },
      );
    }

    return NextResponse.json(payload);
  } catch {
    return NextResponse.json(
      { error: "The AI backend is not reachable. Start FastAPI on port 8000." },
      { status: 503 },
    );
  }
}

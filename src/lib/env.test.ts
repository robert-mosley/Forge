import { afterEach, describe, expect, it, vi } from "vitest";
import { getSupabasePublicEnv, isSupabaseConfigured } from "@/lib/env";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("Supabase environment validation", () => {
  it("reports setup as incomplete when the public values are missing", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");

    expect(isSupabaseConfigured()).toBe(false);
    expect(() => getSupabasePublicEnv()).toThrow(
      "Supabase is not configured.",
    );
  });

  it("accepts a valid URL and non-empty anon key", () => {
    vi.stubEnv(
      "NEXT_PUBLIC_SUPABASE_URL",
      "https://forge-test.supabase.co",
    );
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-public-anon-key");

    expect(isSupabaseConfigured()).toBe(true);
  });
});

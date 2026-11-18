# Forge on Replit

## Run the app

- Install dependencies with `npm install`.
- Start the Next.js development server with `npm run dev`.
- The Replit workflow serves the app on port 5000.

## Foundation architecture

- Next.js App Router and strict TypeScript are under `src/app`.
- Reusable server and browser Supabase clients live under `src/lib/supabase`.
- Supabase credentials are validated lazily with Zod in `src/lib/env.ts`, so the
  public landing page can run before a Supabase project is configured.
- The initial database schema and row-level security policies are in
  `supabase/migrations`.

## Supabase setup

Create a Supabase project, then add these Replit Secrets:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

The database migration can be applied with the Supabase CLI or SQL editor.
Never add a service-role key to client code or commit credentials.

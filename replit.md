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

Apply every SQL file in `supabase/migrations` in filename order. In the
Supabase Auth URL settings, allow the Replit preview origin plus
`/auth/callback` as a redirect URL. Add the local development callback URL too
if you use the app outside Replit.

## Account routes

- `/login` — sign in to an existing account.
- `/signup` — create an account and confirm its email if Supabase requires it.
- `/forgot-password` and `/reset-password` — request and complete account recovery.
- `/profile/setup` — complete the required profile and select self-reported skills.
- `/profile` — update the signed-in student's profile.
- `/dashboard` — protected workspace landing page.

The auth callback exchanges confirmation and recovery codes for a server-side
session. When Supabase Secrets are missing, the public auth pages explain what
must be configured and do not pretend a login or save succeeded.

## Checks

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`

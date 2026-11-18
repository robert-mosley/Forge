# Forge

Forge is a collaboration platform for KSU computer science and engineering
students to find project teammates through demonstrated skills, project work,
courses, interests, and availability.

## Run locally

```bash
npm install
npm run dev
```

The app runs on port 5000. See `replit.md` for the initial architecture and
Supabase setup.

## Account flow

Forge includes `/login`, `/signup`, `/forgot-password`, and
`/reset-password`, plus protected `/dashboard`, `/profile`, and
`/profile/setup` routes. The auth forms are intentionally disabled until the
Supabase URL and anon key are configured in Replit Secrets and the SQL
migrations have been applied.

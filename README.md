# Forge

Forge is a collaboration platform for KSU computer science and engineering
students to find project teammates through demonstrated skills, project work,
courses, interests, and availability.

## Run locally

```bash
npm install
npm run dev
```

## Account flow

Forge includes `/login`, `/signup`, `/forgot-password`, and
`/reset-password`, plus protected `/dashboard`, `/profile`, and
`/profile/setup` routes.

### Supabase configuration

Copy `.env.example` to `.env.local`, set `NEXT_PUBLIC_SUPABASE_URL` and
`NEXT_PUBLIC_SUPABASE_ANON_KEY` from your Supabase project's API settings, and
apply the SQL migrations from `supabase/migrations`. Restart `npm run dev` after
changing environment variables.

For local email confirmation, add `http://localhost:5000/auth/callback` as a
Supabase redirect URL. After confirmation, Forge sends users to `/profile/setup`.
Use `localhost:5000` rather than `0.0.0.0:5000` in the browser.

### Claude portfolio backend

Copy `backend/.env.example` to `backend/.env` and set `ANTHROPIC_API_KEY`.
Optionally set `GITHUB_TOKEN` for higher GitHub API limits.

```bash
npm run backend:install
npm run backend:dev
npm run dev
```

The FastAPI service runs on `http://127.0.0.1:8000` and generates a portfolio draft
from the public GitHub profile. Set `FASTAPI_BACKEND_URL` in `.env.local` only if
the backend is hosted elsewhere.

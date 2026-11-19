# KSUForge FastAPI backend

## Run locally

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

Set `ANTHROPIC_API_KEY` in `.env`, and optionally add `GITHUB_TOKEN` to raise GitHub API limits.

The Next.js app calls `POST /portfolio/generate` with a GitHub username.

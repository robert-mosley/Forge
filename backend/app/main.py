import os
import base64
import json
import re
from typing import Any

import httpx
from anthropic import Anthropic
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from services.candidate_videos import rank_project_posts

load_dotenv(".env")

app = FastAPI(title="Forge Portfolio API", version="1.0.0")

app_origin = os.getenv("NEXT_PUBLIC_APP_ORIGIN", "http://localhost:5000")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[app_origin, "http://127.0.0.1:5000", "http://0.0.0.0:5000"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

class PortfolioRequest(BaseModel):
    github_username: str = Field(min_length=1, max_length=39)


class Project(BaseModel):
    repo_name: str
    github_url: str
    description: str | None = None
    technical_overview: str
    tech_stack: list[str]
    skills: list[str]


class Portfolio(BaseModel):
    username: str
    display_name: str | None = None
    bio: str | None = None
    headline: str
    profile_summary: str
    projects: list[Project]
    skills: list[str]


class FeedCandidate(BaseModel):
    id: str
    data: dict[str, Any] = Field(default_factory=dict)
    base_score: float = 0.0


class FeedRankingRequest(BaseModel):
    profile_embedding: list[float] | None = None
    candidates: list[FeedCandidate]


def github_headers() -> dict[str, str]:
    headers = {
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "forge-portfolio-builder",
    }
    token = os.getenv("GITHUB_TOKEN")
    if token:
        headers["Authorization"] = f"Bearer {token}"
    return headers


async def github_get(client: httpx.AsyncClient, path: str) -> Any:
    response = await client.get(path, headers=github_headers())
    if response.status_code == 404:
        raise HTTPException(status_code=404, detail="That GitHub username could not be found.")
    if response.status_code == 403:
        raise HTTPException(status_code=429, detail="GitHub rate limiting prevented the portfolio import. Try again later.")
    if response.status_code >= 400:
        raise HTTPException(status_code=502, detail=f"GitHub request failed ({response.status_code}).")
    return response.json()

def clean_markdown(markdown: str) -> str:
    markdown = re.sub(r"```.*?```", " ", markdown, flags=re.DOTALL)
    markdown = re.sub(r"!\[[^\]]*\]\([^)]*\)", " ", markdown)
    markdown = re.sub(r"\[([^\]]+)\]\([^)]*\)", r"\1", markdown)
    markdown = re.sub(r"[#>*_`~|]", " ", markdown)
    return re.sub(r"\s+", " ", markdown).strip()[:1800]


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/portfolio/generate", response_model=Portfolio)
async def generate_portfolio(request: PortfolioRequest) -> Portfolio:
    username = request.github_username.strip().lstrip("@").strip()
    if not re.fullmatch(r"[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?", username):
        raise HTTPException(status_code=422, detail="Enter a valid GitHub username.")

    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=503,
            detail="Claude is not configured. Set ANTHROPIC_API_KEY in backend/.env.",
        )

    async with httpx.AsyncClient(base_url="https://api.github.com", timeout=20.0) as client:
        profile = await github_get(client, f"/users/{username}")
        repos = await github_get(
            client,
            f"/users/{profile['login']}/repos?sort=updated&per_page=12&type=owner",
        )

        repository_data: list[dict[str, Any]] = []
        for repo in repos:
            if repo.get("fork") or repo.get("archived"):
                continue

            name = repo["name"]
            languages = await github_get(client, f"/repos/{profile['login']}/{name}/languages")
            readme = ""
            readme_response = await client.get(
                f"/repos/{profile['login']}/{name}/readme",
                headers=github_headers(),
            )
            if readme_response.status_code == 200:
                readme_payload = readme_response.json()
                encoded = readme_payload.get("content")
                if encoded:
                    try:
                        readme = clean_markdown(base64.b64decode(encoded).decode("utf-8", errors="replace"))
                    except Exception:
                        readme = ""

            repository_data.append(
                {
                    "name": name,
                    "url": repo["html_url"],
                    "description": repo.get("description"),
                    "languages": list(languages.keys()),
                    "readme": readme,
                }
            )
            if len(repository_data) >= 6:
                break

    prompt = f"""You create a polished, accurate software portfolio for a KSU computing student.

Use only evidence from the GitHub profile and repository data below. Do not invent employers, degrees, achievements, or features.

GitHub profile:
{json.dumps({"username": profile['login'], "name": profile.get('name'), "bio": profile.get('bio')}, ensure_ascii=False)}

Repositories:
{json.dumps(repository_data, ensure_ascii=False)}

Return valid JSON only, with exactly this shape:
{{
  "headline": "6-12 word portfolio headline",
  "profile_summary": "2-3 sentence first-person-ready summary, no unsupported claims",
  "projects": [
    {{
      "repo_name": "repository name",
      "github_url": "GitHub URL",
      "description": "one concise description or null",
      "technical_overview": "2-3 sentence project summary grounded in the repository",
      "tech_stack": ["technology names"],
      "skills": ["canonical skill names"]
    }}
  ],
  "skills": ["canonical skills across all work"]
}}

Guidelines:
- Use clear, professional language.
- Prefer recognized names such as Python, JavaScript, TypeScript, React, Next.js, Node.js, REST APIs, PostgreSQL, Supabase, Machine learning, Data analysis, Git, Linux, UI and UX design, and Computer vision.
- Select 1-12 portfolio skills.
- Include only repositories supplied; do not add extra project data.
- If evidence is weak, say it is a project or prototype without claiming production use."""

    try:
        client = Anthropic(api_key=api_key)
        configured_model = os.getenv("ANTHROPIC_MODEL", "claude-sonnet-4-6")
        model_candidates = list(dict.fromkeys([
            configured_model,
            "claude-sonnet-4-6",
            "claude-sonnet-5",
            "claude-haiku-4-5-20251001",
        ]))

        last_model_error: Exception | None = None
        response = None
        for model_name in model_candidates:
            try:
                response = client.messages.create(
                    model=model_name,
                    max_tokens=2400,
                    temperature=0.2,
                    messages=[{"role": "user", "content": prompt}],
                )
                break
            except Exception as error:
                last_model_error = error
                if "404" not in str(error) and "not_found_error" not in str(error):
                    raise

        if response is None:
            raise last_model_error or RuntimeError("No Claude model was available.")

        text = "".join(
            block.text for block in response.content if getattr(block, "type", None) == "text"
        ).strip()
        if text.startswith("```"):
            text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.IGNORECASE)
            text = re.sub(r"\s*```$", "", text)
        start = text.find("{")
        end = text.rfind("}")
        if start >= 0 and end > start:
            text = text[start:end + 1]
        generated = json.loads(text)
    except json.JSONDecodeError:
        raise HTTPException(status_code=502, detail="Claude returned an invalid portfolio response.")
    except Exception as error:
        raise HTTPException(status_code=502, detail=f"Claude could not generate the portfolio: {error}")

    projects: list[Project] = []
    for project in generated.get("projects", []):
        try:
            projects.append(Project.model_validate(project))
        except Exception:
            continue

    return Portfolio(
        username=profile["login"],
        display_name=profile.get("name"),
        bio=profile.get("bio"),
        headline=str(generated.get("headline") or "Computer science builder"),
        profile_summary=str(generated.get("profile_summary") or "Builder with a growing collection of software projects."),
        projects=projects,
        skills=[str(skill) for skill in generated.get("skills", [])][:12],
    )


class RankRequest(BaseModel):
    github_username: str = Field(min_length=1, max_length=39)
    project_posts: list[dict[str, Any]]


class RankedProject(BaseModel):
    repo_name: str
    github_url: str
    rank: int


class RankResponse(BaseModel):
    username: str
    ranked_projects: list[RankedProject]


@app.post("/portfolio/rank", response_model=RankResponse)
async def rank_portfolio(request: RankRequest) -> RankResponse:
    username = request.github_username.strip().lstrip("@").strip()
    if not re.fullmatch(r"[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?", username):
        raise HTTPException(status_code=422, detail="Enter a valid GitHub username.")

    project_posts = request.project_posts

    # Call the ranking service
    ranked_projects = await rank_project_posts(username, project_posts)

    return RankResponse(username=username, ranked_projects=ranked_projects)


@app.post("/feed/rank")
def rank_feed(request: FeedRankingRequest) -> dict[str, Any]:
    candidates = [
        {
            "id": candidate.id,
            **candidate.data,
            "base_score": candidate.base_score,
        }
        for candidate in request.candidates
    ]

    ranked = rank_project_posts(request.profile_embedding, candidates)
    return {"projects": ranked}

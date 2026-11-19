import os
import base64
import json
import re
from typing import Any

import httpx
from anthropic import Anthropic
from fastapi import FastAPI, Header, HTTPException
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


class ChatConversationMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str
    conversation: list[ChatConversationMessage] = Field(default_factory=list)


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


def _extract_json(text: str) -> dict[str, Any]:
    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.IGNORECASE)
        text = re.sub(r"\s*```$", "", text)
    start = text.find("{")
    end = text.rfind("}")
    if start >= 0 and end > start:
        text = text[start:end + 1]
    parsed = json.loads(text)
    return parsed if isinstance(parsed, dict) else {}


async def _supabase_rest_get(
    path: str,
    access_token: str,
    supabase_url: str,
    supabase_key: str,
) -> list[dict[str, Any]]:
    if not supabase_url or not supabase_key:
        raise HTTPException(status_code=503, detail="Supabase is not configured for the AI backend.")
    async with httpx.AsyncClient(base_url=supabase_url, timeout=20.0) as client:
        response = await client.get(path, headers={"apikey": supabase_key, "Authorization": f"Bearer {access_token}"})
    if response.status_code >= 400:
        raise HTTPException(status_code=502, detail=f"Supabase could not load discovery data ({response.status_code}).")
    payload = response.json()
    return payload if isinstance(payload, list) else []


async def _verified_supabase_user(
    access_token: str,
    supabase_url: str,
    supabase_key: str,
) -> dict[str, Any]:
    if not supabase_url or not supabase_key:
        raise HTTPException(status_code=503, detail="Supabase is not configured for the AI backend.")
    async with httpx.AsyncClient(base_url=supabase_url, timeout=20.0) as client:
        response = await client.get("/auth/v1/user", headers={"apikey": supabase_key, "Authorization": f"Bearer {access_token}"})
    if response.status_code != 200:
        raise HTTPException(status_code=401, detail="Your Forge session is no longer valid.")
    payload = response.json()
    return payload if isinstance(payload, dict) else {}


def _text(value: Any) -> str:
    return str(value).strip() if value is not None else ""


@app.post("/ai/chat")
async def ai_chat(
    request: ChatRequest,
    authorization: str = Header(default=""),
    x_supabase_url: str = Header(default=""),
    x_supabase_anon_key: str = Header(default=""),
) -> dict[str, Any]:
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentication is required.")

    access_token = authorization.removeprefix("Bearer ").strip()
    supabase_url = x_supabase_url or os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    supabase_key = x_supabase_anon_key or os.getenv("SUPABASE_ANON_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")

    auth_user = await _verified_supabase_user(access_token, supabase_url, supabase_key)
    user_id = _text(auth_user.get("id"))
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication is required.")

    profiles = await _supabase_rest_get(
        "/rest/v1/profiles?select=id,username,full_name,major,campus,academic_year,bio,profile_picture_url,interests,embedding&is_discoverable=eq.true&limit=200",
        access_token,
        supabase_url,
        supabase_key,
    )
    projects = await _supabase_rest_get(
        "/rest/v1/projects?select=id,user_id,title,repo_name,description,post_summary,discipline,project_type,tech_stack,collaboration_roles,seeking_collaborators,github_url,embedding&is_public=eq.true&limit=200",
        access_token,
        supabase_url,
        supabase_key,
    )
    skill_rows = await _supabase_rest_get(
        "/rest/v1/student_skills?select=user_id,skill_id,proficiency,source&limit=1000",
        access_token,
        supabase_url,
        supabase_key,
    )
    skill_catalog = await _supabase_rest_get(
        "/rest/v1/skills?select=id,canonical_name&limit=500",
        access_token,
        supabase_url,
        supabase_key,
    )
    current_profile_rows = await _supabase_rest_get(
        f"/rest/v1/profiles?select=id,username,full_name,major,campus,academic_year,bio,interests,embedding&id=eq.{user_id}&limit=1",
        access_token,
        supabase_url,
        supabase_key,
    )

    skill_name_by_id = {
        _text(skill.get("id")): _text(skill.get("canonical_name"))
        for skill in skill_catalog
    }
    skills_by_user: dict[str, list[str]] = {}
    for row in skill_rows:
        uid = _text(row.get("user_id"))
        skill_name = skill_name_by_id.get(_text(row.get("skill_id")))
        if uid and skill_name:
            skills_by_user.setdefault(uid, [])
            if skill_name not in skills_by_user[uid]:
                skills_by_user[uid].append(skill_name)

    current_profile = current_profile_rows[0] if current_profile_rows else next(
        (profile for profile in profiles if _text(profile.get("id")) == user_id),
        None,
    )

    student_candidates: list[dict[str, Any]] = []
    for profile in profiles:
        pid = _text(profile.get("id"))
        if pid == user_id:
            continue
        username = _text(profile.get("username"))
        if not username:
            continue
        student_candidates.append({
            "id": pid,
            "username": username,
            "full_name": _text(profile.get("full_name") or profile.get("username")),
            "major": profile.get("major"),
            "campus": profile.get("campus"),
            "academic_year": profile.get("academic_year"),
            "bio": profile.get("bio"),
            "profile_picture_url": profile.get("profile_picture_url"),
            "interests": profile.get("interests") or [],
            "skills": skills_by_user.get(pid, []),
        })

    profile_by_id = { _text(profile.get("id")): profile for profile in profiles }
    project_candidates: list[dict[str, Any]] = []
    for project in projects:
        owner_id = _text(project.get("user_id"))
        owner = profile_by_id.get(owner_id, {})
        project_candidates.append({
            "id": _text(project.get("id")),
            "title": _text(project.get("title") or project.get("repo_name") or "Untitled project"),
            "description": project.get("description") or project.get("post_summary"),
            "discipline": project.get("discipline"),
            "project_type": project.get("project_type"),
            "tech_stack": project.get("tech_stack") or [],
            "collaboration_roles": project.get("collaboration_roles") or [],
            "seeking_collaborators": bool(project.get("seeking_collaborators")),
            "github_url": project.get("github_url"),
            "owner_username": owner.get("username"),
            "owner_name": owner.get("full_name") or owner.get("username"),
        })

    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise HTTPException(status_code=503, detail="Claude is not configured for the AI backend.")

    intent_prompt = f"""Analyze this Forge student collaboration request.

Current student:
{json.dumps(current_profile or {}, ensure_ascii=False)}

Conversation:
{json.dumps([{"role": item.role, "content": item.content} for item in request.conversation[-8:]], ensure_ascii=False)}

Latest request:
{request.message}

Available real students:
{json.dumps(student_candidates, ensure_ascii=False)}

Available real projects:
{json.dumps(project_candidates, ensure_ascii=False)}

Return valid JSON only:
{{
  "intent": "students|projects|both",
  "skills": ["skill names"],
  "interests": ["interest names"],
  "majors": ["major names"],
  "message": "A concise helpful response describing what you found.",
  "student_matches": [{{"id":"student id","reason":"specific reason based on profile data"}}],
  "project_matches": [{{"id":"project id","reason":"specific reason based on project data"}}]
}}

Rules:
- Use only students and projects supplied above.
- Do not invent names, skills, majors, projects, or evidence.
- Explain each match with concrete overlapping skills, interests, discipline, or project roles.
- Return at most 6 student matches and at most 6 project matches.
- If no good matches exist, return an honest message and empty arrays.
"""

    try:
        client = Anthropic(api_key=api_key)
        response = client.messages.create(
            model=os.getenv("ANTHROPIC_MODEL", "claude-sonnet-4-6"),
            max_tokens=1800,
            temperature=0.2,
            messages=[{"role": "user", "content": intent_prompt}],
        )
        text = "".join(block.text for block in response.content if getattr(block, "type", None) == "text")
        analysis = _extract_json(text)
    except Exception:
        analysis = {
            "intent": "both",
            "message": "Here are some KSU students and projects that may be relevant to your request.",
            "student_matches": [],
            "project_matches": [],
        }

    message = _text(analysis.get("message") or "Here are the most relevant people and projects I found.")

    student_by_id = {student["id"]: student for student in student_candidates}
    project_by_id = {project["id"]: project for project in project_candidates}

    requested_skills = [str(value).lower() for value in analysis.get("skills", [])]
    requested_interests = [str(value).lower() for value in analysis.get("interests", [])]

    def student_fallback_score(student: dict[str, Any]) -> int:
        haystack = " ".join([
            _text(student.get("full_name")),
            _text(student.get("major")),
            _text(student.get("bio")),
            " ".join(student.get("interests") or []),
            " ".join(student.get("skills") or []),
        ]).lower()
        requested = requested_skills + requested_interests
        matches = sum(1 for term in requested if term in haystack)
        return 100 if matches >= 3 else 70 if matches == 2 else 50 if matches == 1 else 20

    def project_fallback_score(project: dict[str, Any]) -> int:
        haystack = " ".join([
            _text(project.get("title")),
            _text(project.get("description")),
            _text(project.get("discipline")),
            _text(project.get("project_type")),
            " ".join(project.get("tech_stack") or []),
            " ".join(project.get("collaboration_roles") or []),
        ]).lower()
        requested = requested_skills + requested_interests
        matches = sum(1 for term in requested if term in haystack)
        return 100 if matches >= 3 else 70 if matches == 2 else 50 if matches == 1 else 20

    student_matches: list[dict[str, Any]] = []
    for match in analysis.get("student_matches", [])[:6]:
        student = student_by_id.get(_text(match.get("id")))
        if student:
            student_matches.append({
                **student,
                "score": student_fallback_score(student),
                "match_reason": _text(match.get("reason") or "Relevant to your search."),
            })

    if not student_matches:
        student_matches = [
            {**student, "score": student_fallback_score(student), "match_reason": "Relevant to the skills or interests in your request."}
            for student in sorted(student_candidates, key=student_fallback_score, reverse=True)[:6]
            if student_fallback_score(student) >= 50
        ]

    project_matches: list[dict[str, Any]] = []
    for match in analysis.get("project_matches", [])[:6]:
        project = project_by_id.get(_text(match.get("id")))
        if project:
            project_matches.append({
                **project,
                "score": project_fallback_score(project),
                "match_reason": _text(match.get("reason") or "Relevant to your search."),
            })

    if not project_matches:
        project_matches = [
            {**project, "score": project_fallback_score(project), "match_reason": "Relevant to the interests or technologies in your request."}
            for project in sorted(project_candidates, key=project_fallback_score, reverse=True)[:6]
            if project_fallback_score(project) >= 50
        ]

    return {
        "message": message,
        "students": student_matches,
        "projects": project_matches,
    }


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
    ranked_projects = [
        RankedProject(
            repo_name=_text(post.get("repo_name") or post.get("title") or "Untitled project"),
            github_url=_text(post.get("github_url") or ""),
            rank=index,
        )
        for index, post in enumerate(project_posts, start=1)
    ]

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

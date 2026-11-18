export type GitHubPortfolioProject = {
  repo_name: string;
  github_url: string;
  description: string | null;
  technical_overview: string;
  tech_stack: string[];
  skills: string[];
};

export type GitHubPortfolio = {
  username: string;
  display_name: string | null;
  bio: string | null;
  headline?: string;
  profile_summary?: string;
  projects: GitHubPortfolioProject[];
  skills: string[];
};

const languageSkillMap: Record<string, string> = {
  C: "C",
  "C++": "C++",
  "C#": "C#",
  Go: "Go",
  Java: "Java",
  JavaScript: "JavaScript",
  Python: "Python",
  Rust: "Rust",
  SQL: "SQL",
  TypeScript: "TypeScript",
  HTML: "HTML and CSS",
  CSS: "HTML and CSS",
};

function cleanReadme(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_`~|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function detectSkills(languages: string[], readme: string, description: string): string[] {
  const text = `${readme} ${description}`.toLowerCase();
  const skills = new Set<string>();

  for (const language of languages) {
    const mapped = languageSkillMap[language];
    if (mapped) skills.add(mapped);
  }

  const patterns: Array<[string, RegExp]> = [
    ["Next.js", /next(?:\.js)?/i],
    ["React", /react(?:\.js)?|jsx/i],
    ["Node.js", /node(?:\.js)?|express(?:\.js)?/i],
    ["REST APIs", /rest(?:ful)? api|axios|fetch api/i],
    ["PostgreSQL", /postgres(?:ql)?/i],
    ["Supabase", /supabase/i],
    ["Machine learning", /machine learning|tensorflow|pytorch|scikit-learn/i],
    ["Data analysis", /data analysis|pandas|numpy|jupyter/i],
    ["Linux", /linux|ubuntu/i],
    ["Git", /git(?:hub)?/i],
    ["Computer vision", /computer vision|opencv/i],
    ["Embedded systems", /embedded|arduino|raspberry pi/i],
    ["UI and UX design", /ui\/ux|user interface|tailwind/i],
  ];

  for (const [skill, pattern] of patterns) {
    if (pattern.test(text)) skills.add(skill);
  }

  return [...skills];
}

async function githubFetch(path: string): Promise<Response> {
  const headers = new Headers({
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  });
  const token = process.env.GITHUB_TOKEN;
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`https://api.github.com${path}`, {
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      response.status === 404
        ? "That GitHub username could not be found."
        : response.status === 403
          ? "GitHub rate limiting prevented the portfolio import. Try again later."
          : `GitHub could not complete the request (${response.status}).`,
    );
  }

  return response;
}

export async function getGitHubPortfolio(username: string): Promise<GitHubPortfolio> {
  const normalized = username.trim().replace(/^@/, "");
  if (!/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/.test(normalized)) {
    throw new Error("Enter a valid GitHub username.");
  }

  const profileResponse = await githubFetch(`/users/${encodeURIComponent(normalized)}`);
  const profile = await profileResponse.json() as {
    login: string;
    name: string | null;
    bio: string | null;
  };

  const reposResponse = await githubFetch(
    `/users/${encodeURIComponent(profile.login)}/repos?sort=updated&per_page=12&type=owner`,
  );
  const repos = await reposResponse.json() as Array<{
    name: string;
    html_url: string;
    description: string | null;
    fork: boolean;
    archived: boolean;
  }>;

  const projects: GitHubPortfolioProject[] = [];
  const allSkills = new Set<string>();

  for (const repo of repos.filter((item) => !item.fork && !item.archived).slice(0, 6)) {
    const [languagesResponse, readmeResponse] = await Promise.all([
      githubFetch(`/repos/${encodeURIComponent(profile.login)}/${encodeURIComponent(repo.name)}/languages`),
      githubFetch(`/repos/${encodeURIComponent(profile.login)}/${encodeURIComponent(repo.name)}/readme`).catch(() => null),
    ]);

    const languageRecord = await languagesResponse.json() as Record<string, number>;
    const languages = Object.entries(languageRecord)
      .sort((a, b) => b[1] - a[1])
      .map(([language]) => language);

    let readme = "";
    if (readmeResponse) {
      const readmeData = await readmeResponse.json() as { content?: string };
      if (readmeData.content) {
        try {
          readme = Buffer.from(readmeData.content, "base64").toString("utf8");
        } catch {
          readme = "";
        }
      }
    }

    const description = repo.description?.trim() || null;
    const skills = detectSkills(languages, readme, description ?? "");
    for (const skill of skills) allSkills.add(skill);

    const techStack = [...new Set([...languages, ...skills])].slice(0, 12);
    const readmeSummary = cleanReadme(readme).slice(0, 260);
    const overview = description
      ? `${description}${techStack.length ? ` Built with ${techStack.slice(0, 5).join(", ")}.` : ""}`
      : readmeSummary
        ? readmeSummary
        : `${repo.name} is a project by ${profile.login}${techStack.length ? ` using ${techStack.slice(0, 5).join(", ")}.` : "."}`;

    projects.push({
      repo_name: repo.name,
      github_url: repo.html_url,
      description,
      technical_overview: overview,
      tech_stack: techStack,
      skills,
    });
  }

  return {
    username: profile.login,
    display_name: profile.name,
    bio: profile.bio?.trim() || null,
    projects,
    skills: [...allSkills],
  };
}

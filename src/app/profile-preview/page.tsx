"use client";

import { useState, type FormEvent } from "react";

type PortfolioProject = {
  repo_name: string;
  github_url: string;
  description: string | null;
  technical_overview: string;
  tech_stack: string[];
  skills: string[];
};

type Portfolio = {
  username: string;
  display_name: string | null;
  bio: string | null;
  headline: string;
  profile_summary: string;
  projects: PortfolioProject[];
  skills: string[];
};

export default function ProfilePreviewPage() {
  const [username, setUsername] = useState("");
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function generate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    setPortfolio(null);

    try {
      const response = await fetch("/api/portfolio-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ github_username: username }),
      });
      const payload = await response.json();

      if (!response.ok) {
        setError(payload.detail ?? "The portfolio could not be generated.");
        return;
      }

      setPortfolio(payload as Portfolio);
    } catch {
      setError("The preview request could not be completed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="preview-page">
      <header className="preview-header">
        <a className="preview-brand" href="/">KSUForge</a>
        <a className="preview-login" href="/login">Sign in</a>
      </header>

      <section className="preview-generator">
        <div>
          <p className="preview-eyebrow">Public preview / 01</p>
          <h1>Turn GitHub work into a portfolio.</h1>
        </div>
        <form className="preview-form" onSubmit={generate}>
          <label htmlFor="preview-username">GitHub username</label>
          <div>
            <input
              id="preview-username"
              name="github_username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="your-github-name"
              required
            />
            <button disabled={pending} type="submit">
              {pending ? "Generating…" : "Generate preview"}
            </button>
          </div>
        </form>
      </section>

      {error && <p className="preview-error" role="alert">{error}</p>}

      {portfolio && (
        <article className="preview-portfolio">
          <header className="preview-profile">
            <p className="preview-eyebrow">Student portfolio / Preview</p>
            <h2>{portfolio.display_name || portfolio.username}</h2>
            <p className="preview-headline">{portfolio.headline}</p>
            <p className="preview-summary">{portfolio.profile_summary}</p>
            <a href={`https://github.com/${portfolio.username}`} rel="noreferrer" target="_blank">
              github.com/{portfolio.username} ↗
            </a>
          </header>

          <section className="preview-skills">
            <p className="preview-eyebrow">Skills</p>
            <h3>What I work with</h3>
            <ul>
              {portfolio.skills.map((skill) => <li key={skill}>{skill}</li>)}
            </ul>
          </section>

          <section className="preview-projects">
            <p className="preview-eyebrow">Selected work</p>
            <h3>Projects</h3>
            <div>
              {portfolio.projects.map((project) => (
                <article key={project.repo_name}>
                  <h4>{project.repo_name}</h4>
                  {project.description && <p>{project.description}</p>}
                  <p>{project.technical_overview}</p>
                  <ul>
                    {project.tech_stack.slice(0, 8).map((technology) => (
                      <li key={technology}>{technology}</li>
                    ))}
                  </ul>
                  <a href={project.github_url} rel="noreferrer" target="_blank">View repository ↗</a>
                </article>
              ))}
            </div>
          </section>
        </article>
      )}
    </main>
  );
}

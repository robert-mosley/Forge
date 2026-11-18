-- One GitHub repository record per Forge user and repository name.
create unique index if not exists projects_user_repo_unique_idx
  on public.projects (user_id, repo_name);

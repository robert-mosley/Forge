-- Feed and matching fields for project posts.
alter table public.projects
  add column if not exists seeking_collaborators boolean not null default false,
  add column if not exists collaboration_roles text[] not null default '{}',
  add column if not exists post_summary text;

create table if not exists public.project_feed_actions (
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  action text not null check (action in ('like', 'save', 'interest')),
  created_at timestamptz not null default now(),
  primary key (project_id, user_id, action)
);

alter table public.project_feed_actions enable row level security;

drop policy if exists "Users can view feed actions" on public.project_feed_actions;
create policy "Users can view feed actions"
  on public.project_feed_actions for select to authenticated using (true);

drop policy if exists "Users can manage own feed actions" on public.project_feed_actions;
create policy "Users can manage own feed actions"
  on public.project_feed_actions for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

grant usage on schema public to anon, authenticated;
grant select on table public.project_feed_actions to authenticated;
grant insert, update, delete on table public.project_feed_actions to authenticated;

create index if not exists projects_feed_idx
  on public.projects (is_public, seeking_collaborators, created_at desc);
create index if not exists project_feed_actions_project_idx
  on public.project_feed_actions (project_id, action);

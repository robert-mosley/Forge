-- Additive onboarding and portfolio fields. Existing data is preserved.
alter table public.profiles
  add column if not exists profile_picture_url text,
  add column if not exists academic_year text,
  add column if not exists interests text[] not null default '{}',
  add column if not exists is_discoverable boolean not null default true,
  add column if not exists show_availability boolean not null default false,
  add column if not exists github_url text;

alter table public.projects
  add column if not exists title text,
  add column if not exists discipline text,
  add column if not exists project_type text,
  add column if not exists student_role text,
  add column if not exists contributions text,
  add column if not exists outcomes text,
  add column if not exists is_public boolean not null default true;

update public.projects
set title = repo_name
where title is null;

alter table public.projects
  alter column title set default 'Untitled project';

create table if not exists public.project_evidence (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text,
  file_name text not null,
  file_type text,
  file_url text not null,
  storage_path text,
  kind text not null default 'attachment',
  created_at timestamptz not null default now()
);

alter table public.project_evidence enable row level security;

create policy "Authenticated users can view public project evidence"
  on public.project_evidence for select to authenticated using (
    exists (
      select 1 from public.projects
      where projects.id = project_evidence.project_id
        and projects.is_public = true
    )
  );

create policy "Project owners can manage evidence"
  on public.project_evidence for all to authenticated
  using (
    exists (
      select 1 from public.projects
      where projects.id = project_evidence.project_id
        and projects.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.projects
      where projects.id = project_evidence.project_id
        and projects.user_id = (select auth.uid())
    )
  );

create index if not exists profiles_discoverable_idx
  on public.profiles (is_discoverable, major, campus);
create index if not exists projects_public_created_idx
  on public.projects (is_public, created_at desc);
create index if not exists projects_discipline_idx
  on public.projects (discipline);
create index if not exists project_evidence_project_idx
  on public.project_evidence (project_id);

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true), ('project-evidence', 'project-evidence', true)
on conflict (id) do nothing;

create policy "Anyone can read public avatar files"
  on storage.objects for select using (bucket_id = 'avatars');

create policy "Users can upload and manage own avatar files"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Users can update own avatar files"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Users can delete own avatar files"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Anyone can read project evidence"
  on storage.objects for select using (bucket_id = 'project-evidence');

create policy "Users can upload and manage own project evidence"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'project-evidence'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Users can update own project evidence"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'project-evidence'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'project-evidence'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Users can delete own project evidence"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'project-evidence'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

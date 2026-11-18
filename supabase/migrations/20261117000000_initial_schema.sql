create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique,
  full_name text,
  major text,
  campus text,
  bio text,
  github_username text,
  created_at timestamptz not null default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  github_url text,
  repo_name text not null,
  description text,
  technical_overview text,
  tech_stack text[] not null default '{}',
  processing_status text not null default 'pending'
    check (processing_status in ('pending', 'processing', 'ready', 'failed')),
  created_at timestamptz not null default now()
);

create table public.skills (
  id uuid primary key default gen_random_uuid(),
  canonical_name text not null unique,
  category text not null,
  created_at timestamptz not null default now()
);

create table public.project_skills (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  skill_id uuid not null references public.skills (id) on delete cascade,
  confidence numeric(3, 2) not null check (confidence between 0 and 1),
  evidence_type text not null
    check (evidence_type in ('readme', 'language', 'dependency', 'source')),
  evidence_text text not null,
  evidence_path text,
  evidence_url text,
  unique (project_id, skill_id)
);

create table public.student_skills (
  user_id uuid not null references public.profiles (id) on delete cascade,
  skill_id uuid not null references public.skills (id) on delete cascade,
  proficiency text not null
    check (proficiency in ('beginner', 'intermediate', 'advanced', 'expert')),
  source text not null
    check (source in ('manual', 'project', 'course')),
  primary key (user_id, skill_id)
);

create table public.availability (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null check (end_time > start_time),
  campus text
);

create table public.student_courses (
  user_id uuid not null references public.profiles (id) on delete cascade,
  course_code text not null,
  semester text not null,
  primary key (user_id, course_code, semester)
);

create index projects_user_id_idx on public.projects (user_id);
create index projects_created_at_idx on public.projects (created_at desc);
create index project_skills_skill_id_idx on public.project_skills (skill_id);
create index student_skills_skill_id_idx on public.student_skills (skill_id);
create index availability_user_day_idx on public.availability (user_id, day_of_week);
create index student_courses_course_semester_idx
  on public.student_courses (course_code, semester);

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.skills enable row level security;
alter table public.project_skills enable row level security;
alter table public.student_skills enable row level security;
alter table public.availability enable row level security;
alter table public.student_courses enable row level security;

create policy "Authenticated users can view profiles"
  on public.profiles for select to authenticated using (true);
create policy "Users can create their own profile"
  on public.profiles for insert to authenticated with check ((select auth.uid()) = id);
create policy "Users can update their own profile"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy "Authenticated users can view projects"
  on public.projects for select to authenticated using (true);
create policy "Users can create their own projects"
  on public.projects for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can update their own projects"
  on public.projects for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users can delete their own projects"
  on public.projects for delete to authenticated using ((select auth.uid()) = user_id);

create policy "Authenticated users can view skills"
  on public.skills for select to authenticated using (true);

create policy "Authenticated users can view project skills"
  on public.project_skills for select to authenticated using (
    exists (
      select 1 from public.projects
      where projects.id = project_skills.project_id
    )
  );
create policy "Project owners can manage project skills"
  on public.project_skills for all to authenticated
  using (
    exists (
      select 1 from public.projects
      where projects.id = project_skills.project_id
        and projects.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.projects
      where projects.id = project_skills.project_id
        and projects.user_id = (select auth.uid())
    )
  );

create policy "Authenticated users can view student skills"
  on public.student_skills for select to authenticated using (true);
create policy "Users can manage their own student skills"
  on public.student_skills for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "Users can view their own availability"
  on public.availability for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can manage their own availability"
  on public.availability for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "Users can view their own courses"
  on public.student_courses for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can manage their own courses"
  on public.student_courses for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

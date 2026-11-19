-- PostgREST/API roles need table privileges in addition to Row Level Security policies.
grant usage on schema public to anon, authenticated;

grant select on table public.profiles to anon, authenticated;
grant insert, update on table public.profiles to authenticated;

grant select on table public.skills to anon, authenticated;
grant select on table public.student_skills to authenticated;
grant insert, update, delete on table public.student_skills to authenticated;

grant select on table public.projects to anon, authenticated;
grant insert, update, delete on table public.projects to authenticated;

grant select on table public.project_evidence to anon, authenticated;
grant insert, update, delete on table public.project_evidence to authenticated;

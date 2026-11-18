alter table public.student_skills
  drop constraint student_skills_pkey;

alter table public.student_skills
  add constraint student_skills_pkey
  primary key (user_id, skill_id, source);

create extension if not exists vector;

alter table public.profiles
  add column if not exists embedding vector(384);

alter table public.projects
  add column if not exists embedding vector(384);

create index if not exists profiles_embedding_hnsw_idx
  on public.profiles using hnsw (embedding vector_cosine_ops);

create index if not exists projects_embedding_hnsw_idx
  on public.projects using hnsw (embedding vector_cosine_ops);

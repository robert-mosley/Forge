alter table public.profiles
  add constraint profiles_username_format_check
  check (
    username is null
    or (username = lower(username) and username ~ '^[a-z0-9_]{3,24}$')
  );

create unique index profiles_username_case_insensitive_idx
  on public.profiles (lower(username))
  where username is not null;

alter table public.profiles
  add constraint profiles_bio_length_check
  check (bio is null or char_length(bio) <= 280);

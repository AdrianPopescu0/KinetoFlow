-- KinetoFlow — RLS pe catalogul exercise_library
-- Citire: oricine. Scriere: kinetic01flow@gmail.com, admin@kinetoflow.ro.
-- Dacă tabela lipsește, rulează 020_create_exercise_library.sql.

create table if not exists public.exercise_library (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  region text,
  video_url text,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.exercise_library enable row level security;
alter table public.exercise_library force row level security;

alter table public.exercise_library add column if not exists description text;
alter table public.exercise_library add column if not exists subcategory text;
alter table public.exercise_library add column if not exists difficulty text;
alter table public.exercise_library add column if not exists equipment text;
alter table public.exercise_library add column if not exists position text;
alter table public.exercise_library add column if not exists sets integer;
alter table public.exercise_library add column if not exists reps integer;
alter table public.exercise_library add column if not exists duration_seconds integer;
alter table public.exercise_library add column if not exists youtube_id text;
alter table public.exercise_library add column if not exists updated_at timestamptz not null default now();

create or replace function public.is_exercise_library_editor()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select
    lower(coalesce(auth.jwt() ->> 'email', '')) in (
      'kinetic01flow@gmail.com',
      'admin@kinetoflow.ro'
    )
    or exists (
      select 1
      from auth.users u
      where u.id = auth.uid()
        and lower(u.email) in (
          'kinetic01flow@gmail.com',
          'admin@kinetoflow.ro'
        )
    );
$$;

revoke all on function public.is_exercise_library_editor() from public, anon;
grant execute on function public.is_exercise_library_editor() to authenticated;

drop policy if exists "Authenticated read exercise library" on public.exercise_library;
drop policy if exists "Library editor inserts exercises" on public.exercise_library;
drop policy if exists "Library editor updates exercises" on public.exercise_library;
drop policy if exists "Library editor deletes exercises" on public.exercise_library;
drop policy if exists "Only kineto01flow writes exercise library" on public.exercise_library;
drop policy if exists "Only kinetic01flow writes exercise library" on public.exercise_library;

create policy "Authenticated read exercise library"
  on public.exercise_library
  for select
  to authenticated
  using (true);

create policy "Library editor inserts exercises"
  on public.exercise_library
  for insert
  to authenticated
  with check (public.is_exercise_library_editor());

create policy "Library editor updates exercises"
  on public.exercise_library
  for update
  to authenticated
  using (public.is_exercise_library_editor())
  with check (public.is_exercise_library_editor());

create policy "Library editor deletes exercises"
  on public.exercise_library
  for delete
  to authenticated
  using (public.is_exercise_library_editor());

grant select, insert, update, delete on public.exercise_library to authenticated;
revoke all on public.exercise_library from anon, public;

notify pgrst, 'reload schema';

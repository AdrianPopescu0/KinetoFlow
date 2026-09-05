-- KinetoFlow — editori bibliotecă: doar aceste două conturi exacte
-- SELECT: oricine
-- INSERT / UPDATE / DELETE: kinetic01flow@gmail.com, admin@kinetoflow.ro

create table if not exists public.exercise_library (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  created_at timestamptz not null default now()
);

alter table public.exercise_library enable row level security;
alter table public.exercise_library force row level security;

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
drop policy if exists "Anyone can read exercise library" on public.exercise_library;
drop policy if exists "Library editor inserts exercises" on public.exercise_library;
drop policy if exists "Library editor updates exercises" on public.exercise_library;
drop policy if exists "Library editor deletes exercises" on public.exercise_library;
drop policy if exists "Only kineto01flow writes exercise library" on public.exercise_library;
drop policy if exists "Only kinetic01flow writes exercise library" on public.exercise_library;

create policy "Anyone can read exercise library"
  on public.exercise_library
  for select
  to anon, authenticated
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

grant select on public.exercise_library to anon, authenticated;
grant insert, update, delete on public.exercise_library to authenticated;
revoke all on public.exercise_library from public;

notify pgrst, 'reload schema';

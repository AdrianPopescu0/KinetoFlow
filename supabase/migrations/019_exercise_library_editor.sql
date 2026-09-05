-- KinetoFlow — restricționează scrierea pe exercise_library
-- SELECT: orice utilizator autentificat
-- INSERT / UPDATE / DELETE: doar kineto01flow@gmail.com
--   (identificat prin email JWT sau prin auth.users.id)

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
    lower(coalesce(auth.jwt() ->> 'email', '')) = 'kineto01flow@gmail.com'
    or exists (
      select 1
      from auth.users u
      where u.id = auth.uid()
        and lower(u.email) = 'kineto01flow@gmail.com'
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

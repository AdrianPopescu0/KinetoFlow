-- KinetoFlow — RLS clinic_profiles fără recursie
-- Profilul propriu se scrie numai când auth.uid() = user_id.

alter table public.clinic_profiles enable row level security;

create or replace function public.clinic_name_for_user(candidate uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select lower(btrim(cp.clinic_name))
  from public.clinic_profiles cp
  where cp.user_id = candidate
  limit 1;
$$;

revoke all on function public.clinic_name_for_user(uuid) from public, anon;
grant execute on function public.clinic_name_for_user(uuid) to authenticated;

-- Elimină atât politica veche generală, cât și politicile separate.
drop policy if exists "Therapists manage own clinic profile" on public.clinic_profiles;
drop policy if exists "Clinic members read clinic profiles" on public.clinic_profiles;
drop policy if exists "Therapists insert own clinic profile" on public.clinic_profiles;
drop policy if exists "Therapists update own clinic profile" on public.clinic_profiles;
drop policy if exists "Therapists delete own clinic profile" on public.clinic_profiles;

create policy "Clinic members read clinic profiles"
  on public.clinic_profiles
  for select
  to authenticated
  using (
    user_id = auth.uid()
    or lower(btrim(clinic_name)) = public.clinic_name_for_user(auth.uid())
  );

create policy "Therapists insert own clinic profile"
  on public.clinic_profiles
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Therapists update own clinic profile"
  on public.clinic_profiles
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Therapists delete own clinic profile"
  on public.clinic_profiles
  for delete
  to authenticated
  using (auth.uid() = user_id);

grant select, insert, update, delete on public.clinic_profiles to authenticated;

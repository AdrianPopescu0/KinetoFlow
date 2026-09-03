-- KinetoFlow — roluri clinică (admin | therapist) și clinic_id pe profil
-- Rulează în Supabase: SQL Editor → New query → Run

alter table public.clinic_profiles
  add column if not exists role text;

alter table public.clinic_profiles
  add column if not exists clinic_id uuid;

update public.clinic_profiles
set role = 'admin'
where role is null or role not in ('admin', 'therapist');

update public.clinic_profiles
set clinic_id = user_id
where clinic_id is null;

alter table public.clinic_profiles
  alter column role set default 'therapist';

alter table public.clinic_profiles
  alter column role set not null;

alter table public.clinic_profiles
  drop constraint if exists clinic_profiles_role_check;

alter table public.clinic_profiles
  add constraint clinic_profiles_role_check
  check (role in ('admin', 'therapist'));

alter table public.clinic_profiles
  alter column clinic_id set not null;

alter table public.clinic_profiles
  alter column phone drop not null;

create index if not exists clinic_profiles_clinic_id_idx
  on public.clinic_profiles (clinic_id);

-- current_clinic_id: cabinetul din clinic_profiles.clinic_id (nu doar auth.uid())
create or replace function public.current_clinic_id()
returns uuid
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  claim text;
  from_jwt uuid;
  from_profile uuid;
begin
  if auth.uid() is null then
    return null;
  end if;

  claim := coalesce(
    nullif(auth.jwt() ->> 'clinic_id', ''),
    nullif(auth.jwt() -> 'app_metadata' ->> 'clinic_id', ''),
    nullif(auth.jwt() -> 'user_metadata' ->> 'clinic_id', '')
  );

  if claim is not null then
    begin
      from_jwt := claim::uuid;
    exception
      when invalid_text_representation then
        from_jwt := null;
    end;
  end if;

  select cp.clinic_id
    into from_profile
  from public.clinic_profiles cp
  where cp.user_id = auth.uid()
  limit 1;

  if from_jwt is not null and from_profile is not null and from_jwt = from_profile then
    return from_jwt;
  end if;

  return coalesce(from_profile, auth.uid());
end;
$$;

revoke all on function public.current_clinic_id() from public, anon;
grant execute on function public.current_clinic_id() to authenticated;

drop policy if exists "Therapists manage own clinic profile" on public.clinic_profiles;

drop policy if exists "Clinic members read clinic profiles" on public.clinic_profiles;
create policy "Clinic members read clinic profiles"
  on public.clinic_profiles
  for select
  to authenticated
  using (
    user_id = auth.uid()
    or clinic_id = public.current_clinic_id()
  );

drop policy if exists "Therapists insert own clinic profile" on public.clinic_profiles;
create policy "Therapists insert own clinic profile"
  on public.clinic_profiles
  for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "Therapists update own clinic profile" on public.clinic_profiles;
create policy "Therapists update own clinic profile"
  on public.clinic_profiles
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

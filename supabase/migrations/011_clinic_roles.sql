-- KinetoFlow — roluri clinică (admin | therapist)
-- Rulează în Supabase: SQL Editor → New query → Run
--
-- clinic_profiles NU are coloana clinic_id. Cabinetul se leagă prin clinic_name.
-- Tenancy pe pacienți rămâne patients.clinic_id = JWT / user_id al adminului.

alter table public.clinic_profiles
  add column if not exists role text;

update public.clinic_profiles
set role = 'admin'
where role is null or role not in ('admin', 'therapist');

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
  alter column phone drop not null;

create index if not exists clinic_profiles_clinic_name_idx
  on public.clinic_profiles (clinic_name);

-- current_clinic_id: JWT clinic_id (user_id-ul adminului) dacă e din același cabinet,
-- altfel user_id-ul adminului găsit după clinic_name, altfel auth.uid().
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
  from_admin uuid;
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

  select admin.user_id
    into from_admin
  from public.clinic_profiles me
  join public.clinic_profiles admin
    on admin.clinic_name = me.clinic_name
   and admin.role = 'admin'
  where me.user_id = auth.uid()
  limit 1;

  if from_jwt is not null and (from_jwt = auth.uid() or from_jwt = from_admin) then
    return from_jwt;
  end if;

  return coalesce(from_admin, auth.uid());
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
    or clinic_name = (
      select me.clinic_name
      from public.clinic_profiles me
      where me.user_id = auth.uid()
      limit 1
    )
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

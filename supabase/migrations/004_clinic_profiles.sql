-- KinetoFlow — clinic_profiles
-- Copiază tot fișierul în Supabase: SQL Editor → New query → Run
--
-- Coloane: user_id (= auth.uid()), clinic_name, therapist_name, phone

create table if not exists public.clinic_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  clinic_name text not null,
  therapist_name text not null,
  phone text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'clinic_profiles' and column_name = 'id'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'clinic_profiles' and column_name = 'user_id'
  ) then
    alter table public.clinic_profiles rename column id to user_id;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'clinic_profiles' and column_name = 'therapist_id'
  ) then
    update public.clinic_profiles set user_id = therapist_id where user_id is distinct from therapist_id;
    alter table public.clinic_profiles drop column therapist_id;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'clinic_profiles' and column_name = 'therapist_full_name'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'clinic_profiles' and column_name = 'therapist_name'
  ) then
    alter table public.clinic_profiles rename column therapist_full_name to therapist_name;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'clinic_profiles' and column_name = 'contact_phone'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'clinic_profiles' and column_name = 'phone'
  ) then
    alter table public.clinic_profiles rename column contact_phone to phone;
  end if;
end $$;

drop index if exists public.clinic_profiles_therapist_id_idx;

alter table public.clinic_profiles enable row level security;

drop policy if exists "Therapists manage own clinic profile" on public.clinic_profiles;
create policy "Therapists manage own clinic profile"
  on public.clinic_profiles
  for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

grant select, insert, update, delete on public.clinic_profiles to authenticated;

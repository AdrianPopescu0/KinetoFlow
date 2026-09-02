-- KinetoFlow — clinic_profiles
-- Copiază tot fișierul în Supabase: SQL Editor → New query → Run
--
-- id = auth.uid() (contul de terapeut).
-- Dacă exista deja tabela cu coloana therapist_id, este aliniată automat.

create table if not exists public.clinic_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  clinic_name text not null,
  therapist_full_name text not null,
  contact_phone text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'clinic_profiles'
      and column_name = 'therapist_id'
  ) then
    alter table public.clinic_profiles drop constraint if exists clinic_profiles_pkey;
    alter table public.clinic_profiles drop constraint if exists clinic_profiles_therapist_id_key;
    alter table public.clinic_profiles drop constraint if exists clinic_profiles_therapist_id_fkey;
    alter table public.clinic_profiles drop constraint if exists clinic_profiles_id_fkey;

    update public.clinic_profiles set id = therapist_id;

    alter table public.clinic_profiles drop column therapist_id;
    alter table public.clinic_profiles alter column id drop default;

    alter table public.clinic_profiles add primary key (id);
    alter table public.clinic_profiles
      add constraint clinic_profiles_id_fkey
      foreign key (id) references auth.users (id) on delete cascade;
  end if;
end $$;

drop index if exists public.clinic_profiles_therapist_id_idx;

alter table public.clinic_profiles enable row level security;

drop policy if exists "Therapists manage own clinic profile" on public.clinic_profiles;
create policy "Therapists manage own clinic profile"
  on public.clinic_profiles
  for all
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

grant select, insert, update, delete on public.clinic_profiles to authenticated;

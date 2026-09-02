-- Profilul clinicii: cheia primară este auth.uid().
-- Rulează în Supabase: SQL Editor → New query → Run

create table if not exists public.clinic_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  clinic_name text not null,
  therapist_full_name text not null,
  contact_phone text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.clinic_profiles enable row level security;

drop policy if exists "Therapists manage own clinic profile" on public.clinic_profiles;
create policy "Therapists manage own clinic profile"
  on public.clinic_profiles
  for all
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

grant select, insert, update, delete on public.clinic_profiles to authenticated;

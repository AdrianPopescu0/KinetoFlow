-- KinetoFlow — schema pacienți, exerciții și check-in-uri
-- Rulează în Supabase: SQL Editor → New query → Run

create extension if not exists pgcrypto;

create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  therapist_id uuid not null references auth.users (id) on delete cascade,
  full_name text not null,
  email text,
  phone text,
  diagnosis text,
  token uuid not null unique default gen_random_uuid(),
  access_code varchar(8) unique,
  created_at timestamptz not null default now()
);

create table if not exists public.exercises (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  title text not null,
  video_url text,
  sets integer,
  reps integer,
  notes text
);

create table if not exists public.check_ins (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  vas_score integer not null check (vas_score between 0 and 10),
  sleep_quality text,
  pain_type text,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists patients_therapist_id_idx on public.patients (therapist_id);
create index if not exists patients_token_idx on public.patients (token);
create index if not exists exercises_patient_id_idx on public.exercises (patient_id);
create index if not exists check_ins_patient_id_idx on public.check_ins (patient_id);

alter table public.patients enable row level security;
alter table public.exercises enable row level security;
alter table public.check_ins enable row level security;

drop policy if exists "Therapists manage own patients" on public.patients;
create policy "Therapists manage own patients"
  on public.patients
  for all
  to authenticated
  using (therapist_id = auth.uid())
  with check (therapist_id = auth.uid());

drop policy if exists "Therapists manage exercises for own patients" on public.exercises;
create policy "Therapists manage exercises for own patients"
  on public.exercises
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.patients p
      where p.id = exercises.patient_id
        and p.therapist_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.patients p
      where p.id = exercises.patient_id
        and p.therapist_id = auth.uid()
    )
  );

drop policy if exists "Therapists manage check-ins for own patients" on public.check_ins;
create policy "Therapists manage check-ins for own patients"
  on public.check_ins
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.patients p
      where p.id = check_ins.patient_id
        and p.therapist_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.patients p
      where p.id = check_ins.patient_id
        and p.therapist_id = auth.uid()
    )
  );

grant select, insert, update, delete on public.patients to authenticated;
grant select, insert, update, delete on public.exercises to authenticated;
grant select, insert, update, delete on public.check_ins to authenticated;

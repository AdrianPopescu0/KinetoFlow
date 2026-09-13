-- Arhivă pacienți + interval de abonament al clinicii.
-- Rulează în Supabase → SQL Editor. Nu se aplică automat la build-ul Vercel.
-- Idempotent: add column if not exists, indecși if not exists, backfill doar pe NULL.

alter table public.patients
  add column if not exists archived_at timestamptz;

comment on column public.patients.archived_at is
  'Momentul arhivării. NULL = pacient activ în dashboard.';

create index if not exists patients_archived_at_idx
  on public.patients (archived_at);

alter table public.clinic_profiles
  add column if not exists subscription_starts_at timestamptz;

alter table public.clinic_profiles
  add column if not exists subscription_ends_at timestamptz;

alter table public.clinic_profiles
  alter column subscription_starts_at set default now();

alter table public.clinic_profiles
  alter column subscription_ends_at set default (now() + interval '1 year');

update public.clinic_profiles
set
  subscription_starts_at = coalesce(subscription_starts_at, now()),
  subscription_ends_at = coalesce(subscription_ends_at, now() + interval '1 year')
where subscription_starts_at is null
   or subscription_ends_at is null;

comment on column public.clinic_profiles.subscription_starts_at is
  'Începutul intervalului de abonament activ (inclusiv).';

comment on column public.clinic_profiles.subscription_ends_at is
  'Sfârșitul intervalului de abonament activ (inclusiv).';

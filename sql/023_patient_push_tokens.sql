-- Tokenuri FCM (web push) pentru reminder-ele de check-in.
-- Rulează în Supabase → SQL Editor. Nu se aplică automat la build-ul Vercel.

create table if not exists public.patient_push_tokens (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  token text not null,
  platform text not null default 'web',
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint patient_push_tokens_token_key unique (token)
);

create index if not exists patient_push_tokens_patient_id_idx
  on public.patient_push_tokens (patient_id);

comment on table public.patient_push_tokens is
  'Device-uri (FCM web push) pe care pacientul a acceptat reminder-ele. Cron-ul trimite push aici în loc de SMS.';

alter table public.patient_push_tokens enable row level security;

drop policy if exists patient_push_tokens_service_role on public.patient_push_tokens;

-- Portalul pacientului scrie prin service role; terapeuții nu citesc tokenurile din UI.
create policy patient_push_tokens_service_role
  on public.patient_push_tokens
  for all
  to service_role
  using (true)
  with check (true);

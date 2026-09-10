-- KinetoFlow — invitații terapeuți (SMS / WhatsApp), fără cont Auth dinainte
-- Rulează în Supabase: SQL Editor → New query → Run
--
-- Adminul salvează o invitație + token unic + email. Terapeutul deschide
-- /auth/invitatie/<token>, își alege parola (emailul e precompletat) și
-- activează contul, fără OTP.

create table if not exists public.therapist_invites (
  id uuid primary key default gen_random_uuid(),
  token text not null,
  clinic_name text not null,
  clinic_owner_id uuid not null,
  invited_by uuid not null,
  therapist_name text not null,
  phone text not null,
  email text,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  accepted_user_id uuid,
  created_at timestamptz not null default now(),
  constraint therapist_invites_token_len check (char_length(token) between 20 and 80),
  constraint therapist_invites_therapist_name_len check (char_length(therapist_name) between 2 and 120),
  constraint therapist_invites_clinic_name_len check (char_length(clinic_name) between 1 and 160)
);

create unique index if not exists therapist_invites_token_idx
  on public.therapist_invites (token);

create index if not exists therapist_invites_clinic_pending_idx
  on public.therapist_invites (clinic_name, phone, created_at desc)
  where accepted_at is null;

create index if not exists therapist_invites_pending_email_idx
  on public.therapist_invites (email, created_at desc)
  where accepted_at is null and email is not null;

alter table public.therapist_invites enable row level security;

revoke all on public.therapist_invites from anon, authenticated, public;

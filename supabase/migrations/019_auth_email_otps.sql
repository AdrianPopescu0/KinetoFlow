-- KinetoFlow — OTP / link de autentificare pe email (admin + terapeut)
-- Copiază tot fișierul în Supabase: SQL Editor → New query → Run (sau vezi sql/026_auth_email_otps.sql)

create table if not exists public.auth_email_otps (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  code_hash text not null,
  link_token_hash text not null,
  purpose text not null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  attempt_count integer not null default 0,
  created_at timestamptz not null default now(),
  constraint auth_email_otps_purpose_check
    check (purpose in ('login', 'register')),
  constraint auth_email_otps_email_len check (char_length(email) between 3 and 160),
  constraint auth_email_otps_attempt_count_check check (attempt_count >= 0)
);

create index if not exists auth_email_otps_email_created_idx
  on public.auth_email_otps (email, created_at desc);

create unique index if not exists auth_email_otps_link_token_hash_idx
  on public.auth_email_otps (link_token_hash);

alter table public.auth_email_otps enable row level security;

revoke all on public.auth_email_otps from anon, authenticated, public;

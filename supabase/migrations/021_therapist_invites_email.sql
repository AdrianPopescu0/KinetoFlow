-- Copie idempotentă a sql/029_therapist_invites_email.sql

alter table public.therapist_invites
  add column if not exists email text;

create index if not exists therapist_invites_pending_email_idx
  on public.therapist_invites (email, created_at desc)
  where accepted_at is null and email is not null;

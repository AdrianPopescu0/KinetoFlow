-- KinetoFlow — email pe invitația de terapeut (asociere Google OAuth)
-- Rulează în Supabase SQL Editor dacă tabela există deja fără coloana email.

alter table public.therapist_invites
  add column if not exists email text;

create index if not exists therapist_invites_pending_email_idx
  on public.therapist_invites (email, created_at desc)
  where accepted_at is null and email is not null;

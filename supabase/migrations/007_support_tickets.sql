-- KinetoFlow — support_tickets
-- Copiază tot fișierul în Supabase: SQL Editor → New query → Run
--
-- Mesaje din formularul public de suport (footer). Fără SELECT public:
-- citirea rămâne doar pentru service role / SQL Editor.

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact text not null,
  message text not null,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  constraint support_tickets_status_check
    check (status in ('open', 'in_progress', 'closed')),
  constraint support_tickets_name_len check (char_length(name) between 1 and 120),
  constraint support_tickets_contact_len check (char_length(contact) between 1 and 160),
  constraint support_tickets_message_len check (char_length(message) between 1 and 4000)
);

create index if not exists support_tickets_created_at_idx
  on public.support_tickets (created_at desc);

create index if not exists support_tickets_status_idx
  on public.support_tickets (status);

alter table public.support_tickets enable row level security;

revoke all on public.support_tickets from anon, authenticated, public;

grant insert on public.support_tickets to anon, authenticated;

drop policy if exists "Public can submit support tickets" on public.support_tickets;
create policy "Public can submit support tickets"
  on public.support_tickets
  for insert
  to anon, authenticated
  with check (
    char_length(trim(name)) > 0
    and char_length(trim(contact)) > 0
    and char_length(trim(message)) > 0
    and char_length(name) <= 120
    and char_length(contact) <= 160
    and char_length(message) <= 4000
  );

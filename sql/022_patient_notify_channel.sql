-- Canalul prin care s-a trimis invitația inițială (WhatsApp sau SMS).
-- Rulează în Supabase → SQL Editor. Nu se aplică automat la build-ul Vercel.

alter table public.patients
  add column if not exists notify_channel text;

alter table public.patients
  drop constraint if exists patients_notify_channel_check;

alter table public.patients
  add constraint patients_notify_channel_check
  check (notify_channel is null or notify_channel in ('whatsapp', 'sms'));

comment on column public.patients.notify_channel is
  'Canalul invitației inițiale: whatsapp sau sms. Reminder-ele ulterioare folosesc același canal.';

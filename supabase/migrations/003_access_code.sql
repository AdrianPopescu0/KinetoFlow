-- Cod de acces 8 cifre + email rămâne opțional. Telefonul e obligatoriu în aplicație la pacienți noi.
-- Rulează în Supabase SQL Editor dacă tabela patients există deja.

alter table public.patients
  add column if not exists access_code varchar(8);

create unique index if not exists patients_access_code_uidx
  on public.patients (access_code)
  where access_code is not null;

comment on column public.patients.email is 'Opțional. Accesul pacientului se face cu telefon + access_code.';
comment on column public.patients.phone is 'Obligatoriu la pacienți noi. Stocat ca 40xxxxxxxxxx.';
comment on column public.patients.access_code is 'Cod unic de 8 cifre pentru login-ul pacientului.';

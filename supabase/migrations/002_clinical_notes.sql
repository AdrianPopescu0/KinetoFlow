-- Note clinice pe fișa pacientului
alter table public.patients
  add column if not exists clinical_notes text;

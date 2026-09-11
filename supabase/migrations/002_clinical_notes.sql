-- Opțional / vechi: coloană pe `patients`. Aplicația scrie notițele în `patient_notes`
-- (`sql/030_patient_notes.sql`). Nu mai folosi această coloană pentru salvare.
alter table public.patients
  add column if not exists clinical_notes text;

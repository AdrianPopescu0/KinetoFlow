-- KinetoFlow — indecși pentru liste (dashboard, bibliotecă, check-in-uri)
-- Rulează în Supabase: SQL Editor → New query → Run. Nu se aplică automat pe Vercel.
-- Idempotent (IF NOT EXISTS). Nu schimbă coloane, RLS sau datele existente.
-- Complementează indecșii din 001_patients.sql și 010_assigned_therapist.sql:
--   patients(therapist_id), patients(assigned_therapist_id),
--   exercises(patient_id), check_ins(patient_id).

-- Listă pacienți: ORDER BY created_at DESC
create index if not exists patients_created_at_idx
  on public.patients (created_at desc);

-- Embed / fallback check_ins pe pacient (ultimul VAS, check-in-uri azi, complianță 7 zile)
create index if not exists check_ins_patient_created_at_idx
  on public.check_ins (patient_id, created_at desc);

-- Catalogul din exercise_library: ORDER BY created_at DESC
create index if not exists exercise_library_created_at_idx
  on public.exercise_library (created_at desc);

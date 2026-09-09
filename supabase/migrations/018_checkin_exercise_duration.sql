-- KinetoFlow — durata ședinței de exerciții, salvată la check-in
-- Rulează în Supabase: SQL Editor → New query → Run

alter table public.check_ins
  add column if not exists exercise_duration_seconds integer;

alter table public.check_ins
  drop constraint if exists check_ins_exercise_duration_seconds_check;

alter table public.check_ins
  add constraint check_ins_exercise_duration_seconds_check
  check (
    exercise_duration_seconds is null
    or (
      exercise_duration_seconds >= 0
      and exercise_duration_seconds <= 86400
    )
  );

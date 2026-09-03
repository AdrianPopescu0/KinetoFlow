-- KinetoFlow — nivel de energie la check-in-ul zilnic
-- Rulează în Supabase: SQL Editor → New query → Run

alter table public.check_ins
  add column if not exists energy_level text;

alter table public.check_ins
  drop constraint if exists check_ins_energy_level_check;

alter table public.check_ins
  add constraint check_ins_energy_level_check
  check (
    energy_level is null
    or energy_level in ('epuizat', 'scazuta', 'moderata', 'buna', 'maxima')
  );

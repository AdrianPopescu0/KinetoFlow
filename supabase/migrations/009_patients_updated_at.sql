-- KinetoFlow — updated_at pe fișa pacientului (control concurență la salvare)
-- Rulează în Supabase: SQL Editor → New query → Run

alter table public.patients
  add column if not exists updated_at timestamptz not null default now();

update public.patients
set updated_at = coalesce(updated_at, created_at, now())
where true;

create or replace function public.patients_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists patients_touch_updated_at on public.patients;
create trigger patients_touch_updated_at
  before update on public.patients
  for each row
  execute procedure public.patients_touch_updated_at();

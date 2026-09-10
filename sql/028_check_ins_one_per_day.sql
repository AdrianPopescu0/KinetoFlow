-- KinetoFlow — un singur check-in pe pacient pe zi calendaristică (Europe/Bucharest)
-- Rulează în Supabase: SQL Editor → New query → Run
-- Idempotent. Păstrează primul check-in (cel mai vechi created_at) când există duplicate.

alter table public.check_ins
  add column if not exists local_date date;

update public.check_ins
set local_date = (timezone('Europe/Bucharest', created_at))::date
where local_date is null;

delete from public.check_ins as duplicate
using public.check_ins as keeper
where duplicate.patient_id = keeper.patient_id
  and coalesce(duplicate.local_date, (timezone('Europe/Bucharest', duplicate.created_at))::date)
    = coalesce(keeper.local_date, (timezone('Europe/Bucharest', keeper.created_at))::date)
  and (
    keeper.created_at < duplicate.created_at
    or (keeper.created_at = duplicate.created_at and keeper.id < duplicate.id)
  );

update public.check_ins
set local_date = (timezone('Europe/Bucharest', created_at))::date
where local_date is null;

alter table public.check_ins
  alter column local_date set not null;

create unique index if not exists check_ins_patient_local_date_uidx
  on public.check_ins (patient_id, local_date);

create or replace function public.check_ins_set_local_date()
returns trigger
language plpgsql
as $$
begin
  if new.local_date is null then
    new.local_date := (timezone('Europe/Bucharest', coalesce(new.created_at, now())))::date;
  end if;
  return new;
end;
$$;

drop trigger if exists check_ins_set_local_date on public.check_ins;
create trigger check_ins_set_local_date
  before insert or update on public.check_ins
  for each row
  execute procedure public.check_ins_set_local_date();

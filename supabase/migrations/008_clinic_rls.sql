-- KinetoFlow — RLS pe clinică pentru patients, exercises (program asignat) și check_ins
-- Copiază tot fișierul în Supabase: SQL Editor → New query → Run
--
-- Clinică = clinic_profiles.user_id (1 terapeut = 1 cabinet, deocamdată).
-- current_clinic_id() citește claim-ul JWT `clinic_id` doar dacă coincidă cu
-- profilul terapeutului / auth.uid(); nu se poate imperssona alt cabinet din JWT.

create or replace function public.current_clinic_id()
returns uuid
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  claim text;
  from_jwt uuid;
  from_profile uuid;
begin
  if auth.uid() is null then
    return null;
  end if;

  claim := coalesce(
    nullif(auth.jwt() ->> 'clinic_id', ''),
    nullif(auth.jwt() -> 'app_metadata' ->> 'clinic_id', ''),
    nullif(auth.jwt() -> 'user_metadata' ->> 'clinic_id', '')
  );

  if claim is not null then
    begin
      from_jwt := claim::uuid;
    exception
      when invalid_text_representation then
        from_jwt := null;
    end;
  end if;

  select cp.user_id
    into from_profile
  from public.clinic_profiles cp
  where cp.user_id = auth.uid()
  limit 1;

  -- JWT e luat în seamă doar dacă aparține acestui terapeut
  if from_jwt is not null and (from_jwt = auth.uid() or from_jwt = from_profile) then
    return from_jwt;
  end if;

  return coalesce(from_profile, auth.uid());
end;
$$;

revoke all on function public.current_clinic_id() from public, anon;
grant execute on function public.current_clinic_id() to authenticated;

-- Coloane clinic_id
alter table public.patients
  add column if not exists clinic_id uuid;

update public.patients
set clinic_id = coalesce(user_id, therapist_id)
where clinic_id is null;

alter table public.patients
  alter column clinic_id set not null;

create index if not exists patients_clinic_id_idx on public.patients (clinic_id);

alter table public.exercises
  add column if not exists clinic_id uuid;

update public.exercises e
set clinic_id = p.clinic_id
from public.patients p
where e.patient_id = p.id
  and e.clinic_id is null;

alter table public.check_ins
  add column if not exists clinic_id uuid;

update public.check_ins c
set clinic_id = p.clinic_id
from public.patients p
where c.patient_id = p.id
  and c.clinic_id is null;

-- Trigger pacienți: forțează clinic_id + user_id din sesiune
create or replace function public.patients_enforce_tenant()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null then
    if tg_op = 'INSERT' then
      new.clinic_id := public.current_clinic_id();
      new.user_id := coalesce(new.user_id, auth.uid());
      new.therapist_id := coalesce(new.therapist_id, auth.uid());
    elsif tg_op = 'UPDATE' then
      new.clinic_id := old.clinic_id;
      new.user_id := old.user_id;
      new.therapist_id := old.therapist_id;
    end if;
  else
    if new.clinic_id is null then
      new.clinic_id := coalesce(new.user_id, new.therapist_id);
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists patients_enforce_tenant on public.patients;
create trigger patients_enforce_tenant
  before insert or update on public.patients
  for each row
  execute procedure public.patients_enforce_tenant();

-- Trigger program/check-in: clinic_id din pacient (nu din client)
create or replace function public.treatment_rows_enforce_clinic()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  patient_clinic uuid;
begin
  select p.clinic_id into patient_clinic
  from public.patients p
  where p.id = new.patient_id;

  if patient_clinic is null then
    raise exception 'Pacient inexistent sau fără clinic_id';
  end if;

  if tg_op = 'INSERT' then
    new.clinic_id := patient_clinic;
  elsif tg_op = 'UPDATE' then
    new.clinic_id := old.clinic_id;
    new.patient_id := old.patient_id;
  end if;

  return new;
end;
$$;

drop trigger if exists exercises_enforce_clinic on public.exercises;
create trigger exercises_enforce_clinic
  before insert or update on public.exercises
  for each row
  execute procedure public.treatment_rows_enforce_clinic();

drop trigger if exists check_ins_enforce_clinic on public.check_ins;
create trigger check_ins_enforce_clinic
  before insert or update on public.check_ins
  for each row
  execute procedure public.treatment_rows_enforce_clinic();

-- Not null pe child după backfill (rânduri orfane rămân skip)
update public.exercises e
set clinic_id = p.clinic_id
from public.patients p
where e.patient_id = p.id
  and e.clinic_id is null;

update public.check_ins c
set clinic_id = p.clinic_id
from public.patients p
where c.patient_id = p.id
  and c.clinic_id is null;

-- Not null pe child după backfill (rânduri orfane rămân nullable)
do $$
begin
  if not exists (select 1 from public.exercises where clinic_id is null) then
    alter table public.exercises alter column clinic_id set not null;
  end if;
  if not exists (select 1 from public.check_ins where clinic_id is null) then
    alter table public.check_ins alter column clinic_id set not null;
  end if;
end $$;

create index if not exists exercises_clinic_id_idx on public.exercises (clinic_id);
create index if not exists check_ins_clinic_id_idx on public.check_ins (clinic_id);

-- RLS forțat
alter table public.patients enable row level security;
alter table public.patients force row level security;
alter table public.exercises enable row level security;
alter table public.exercises force row level security;
alter table public.check_ins enable row level security;
alter table public.check_ins force row level security;

revoke all on public.patients from anon, public;
revoke all on public.exercises from anon, public;
revoke all on public.check_ins from anon, public;

grant select, insert, update, delete on public.patients to authenticated;
grant select, insert, update, delete on public.exercises to authenticated;
grant select, insert, update, delete on public.check_ins to authenticated;

-- Înlocuiește politicile per-user cu politici per-clinică
drop policy if exists "Therapists manage own patients" on public.patients;
drop policy if exists "Therapists select clinic patients" on public.patients;
drop policy if exists "Therapists insert clinic patients" on public.patients;
drop policy if exists "Therapists update clinic patients" on public.patients;
drop policy if exists "Therapists delete clinic patients" on public.patients;

create policy "Therapists select clinic patients"
  on public.patients
  for select
  to authenticated
  using (clinic_id = public.current_clinic_id());

create policy "Therapists insert clinic patients"
  on public.patients
  for insert
  to authenticated
  with check (clinic_id = public.current_clinic_id());

create policy "Therapists update clinic patients"
  on public.patients
  for update
  to authenticated
  using (clinic_id = public.current_clinic_id())
  with check (clinic_id = public.current_clinic_id());

create policy "Therapists delete clinic patients"
  on public.patients
  for delete
  to authenticated
  using (clinic_id = public.current_clinic_id());

drop policy if exists "Therapists manage exercises for own patients" on public.exercises;
drop policy if exists "Therapists select clinic exercises" on public.exercises;
drop policy if exists "Therapists insert clinic exercises" on public.exercises;
drop policy if exists "Therapists update clinic exercises" on public.exercises;
drop policy if exists "Therapists delete clinic exercises" on public.exercises;

create policy "Therapists select clinic exercises"
  on public.exercises
  for select
  to authenticated
  using (
    clinic_id = public.current_clinic_id()
    and exists (
      select 1 from public.patients p
      where p.id = exercises.patient_id
        and p.clinic_id = public.current_clinic_id()
    )
  );

create policy "Therapists insert clinic exercises"
  on public.exercises
  for insert
  to authenticated
  with check (
    clinic_id = public.current_clinic_id()
    and exists (
      select 1 from public.patients p
      where p.id = exercises.patient_id
        and p.clinic_id = public.current_clinic_id()
    )
  );

create policy "Therapists update clinic exercises"
  on public.exercises
  for update
  to authenticated
  using (
    clinic_id = public.current_clinic_id()
    and exists (
      select 1 from public.patients p
      where p.id = exercises.patient_id
        and p.clinic_id = public.current_clinic_id()
    )
  )
  with check (
    clinic_id = public.current_clinic_id()
    and exists (
      select 1 from public.patients p
      where p.id = exercises.patient_id
        and p.clinic_id = public.current_clinic_id()
    )
  );

create policy "Therapists delete clinic exercises"
  on public.exercises
  for delete
  to authenticated
  using (
    clinic_id = public.current_clinic_id()
    and exists (
      select 1 from public.patients p
      where p.id = exercises.patient_id
        and p.clinic_id = public.current_clinic_id()
    )
  );

drop policy if exists "Therapists manage check-ins for own patients" on public.check_ins;
drop policy if exists "Therapists select clinic check-ins" on public.check_ins;
drop policy if exists "Therapists insert clinic check-ins" on public.check_ins;
drop policy if exists "Therapists update clinic check-ins" on public.check_ins;
drop policy if exists "Therapists delete clinic check-ins" on public.check_ins;

create policy "Therapists select clinic check-ins"
  on public.check_ins
  for select
  to authenticated
  using (
    clinic_id = public.current_clinic_id()
    and exists (
      select 1 from public.patients p
      where p.id = check_ins.patient_id
        and p.clinic_id = public.current_clinic_id()
    )
  );

create policy "Therapists insert clinic check-ins"
  on public.check_ins
  for insert
  to authenticated
  with check (
    clinic_id = public.current_clinic_id()
    and exists (
      select 1 from public.patients p
      where p.id = check_ins.patient_id
        and p.clinic_id = public.current_clinic_id()
    )
  );

create policy "Therapists update clinic check-ins"
  on public.check_ins
  for update
  to authenticated
  using (
    clinic_id = public.current_clinic_id()
    and exists (
      select 1 from public.patients p
      where p.id = check_ins.patient_id
        and p.clinic_id = public.current_clinic_id()
    )
  )
  with check (
    clinic_id = public.current_clinic_id()
    and exists (
      select 1 from public.patients p
      where p.id = check_ins.patient_id
        and p.clinic_id = public.current_clinic_id()
    )
  );

create policy "Therapists delete clinic check-ins"
  on public.check_ins
  for delete
  to authenticated
  using (
    clinic_id = public.current_clinic_id()
    and exists (
      select 1 from public.patients p
      where p.id = check_ins.patient_id
        and p.clinic_id = public.current_clinic_id()
    )
  );

notify pgrst, 'reload schema';

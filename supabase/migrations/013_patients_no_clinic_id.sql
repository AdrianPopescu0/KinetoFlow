create or replace function public.same_clinic_therapist(candidate uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    candidate is not null
    and exists (
      select 1
      from public.clinic_profiles me
      join public.clinic_profiles teammate
        on btrim(teammate.clinic_name) = btrim(me.clinic_name)
      where me.user_id = auth.uid()
        and teammate.user_id = candidate
    );
$$;

revoke all on function public.same_clinic_therapist(uuid) from public, anon;
grant execute on function public.same_clinic_therapist(uuid) to authenticated;

-- KinetoFlow — patients nu are coloana clinic_id
-- Triggerul vechi (008) scria new.clinic_id la INSERT/UPDATE și crapă asignarea.

create or replace function public.patients_enforce_tenant()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null then
    if tg_op = 'INSERT' then
      new.user_id := coalesce(new.user_id, auth.uid());
      new.therapist_id := coalesce(new.therapist_id, auth.uid());
    elsif tg_op = 'UPDATE' then
      new.user_id := old.user_id;
      new.therapist_id := old.therapist_id;
    end if;
  end if;
  return new;
end;
$$;

create or replace function public.treatment_rows_enforce_clinic()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  owner_id uuid;
begin
  select p.therapist_id
    into owner_id
  from public.patients p
  where p.id = new.patient_id;

  if owner_id is null then
    raise exception 'Pacient inexistent';
  end if;

  if tg_op = 'INSERT' then
    new.clinic_id := coalesce(public.current_clinic_id(), owner_id);
  elsif tg_op = 'UPDATE' then
    new.clinic_id := old.clinic_id;
    new.patient_id := old.patient_id;
  end if;

  return new;
end;
$$;

drop index if exists public.patients_clinic_id_idx;

drop policy if exists "Therapists select clinic patients" on public.patients;
drop policy if exists "Therapists insert clinic patients" on public.patients;
drop policy if exists "Therapists update clinic patients" on public.patients;
drop policy if exists "Therapists delete clinic patients" on public.patients;
drop policy if exists "Therapists manage own patients" on public.patients;

create policy "Therapists select clinic patients"
  on public.patients
  for select
  to authenticated
  using (
    therapist_id = auth.uid()
    or assigned_therapist_id = auth.uid()
    or public.same_clinic_therapist(therapist_id)
  );

create policy "Therapists insert clinic patients"
  on public.patients
  for insert
  to authenticated
  with check (therapist_id = auth.uid());

create policy "Therapists update clinic patients"
  on public.patients
  for update
  to authenticated
  using (
    therapist_id = auth.uid()
    or assigned_therapist_id = auth.uid()
    or public.same_clinic_therapist(therapist_id)
  )
  with check (
    therapist_id = auth.uid()
    or public.same_clinic_therapist(therapist_id)
  );

create policy "Therapists delete clinic patients"
  on public.patients
  for delete
  to authenticated
  using (
    therapist_id = auth.uid()
    or public.same_clinic_therapist(therapist_id)
  );

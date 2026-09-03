-- KinetoFlow — pacienți vizibili după clinic_name (nu clinic_id pe clinic_profiles)
-- Pacientul aparține cabinetului dacă therapist_id e un user_id din același clinic_name.

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
        on teammate.clinic_name = me.clinic_name
      where me.user_id = auth.uid()
        and teammate.user_id = candidate
    );
$$;

revoke all on function public.same_clinic_therapist(uuid) from public, anon;
grant execute on function public.same_clinic_therapist(uuid) to authenticated;

drop policy if exists "Therapists select clinic patients" on public.patients;
drop policy if exists "Therapists insert clinic patients" on public.patients;
drop policy if exists "Therapists update clinic patients" on public.patients;
drop policy if exists "Therapists delete clinic patients" on public.patients;

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

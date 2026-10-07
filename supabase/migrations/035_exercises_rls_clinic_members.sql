-- KinetoFlow — repară RLS pe exercises / check_ins pentru membrii cabinetului
-- Tenancy: therapist_id / assigned_therapist_id + clinic_profiles.clinic_name
-- (nu clinic_id / current_clinic_id pe patients)

alter table public.exercises enable row level security;
alter table public.exercises force row level security;

revoke all on public.exercises from anon, public;
grant select, insert, update, delete on public.exercises to authenticated;
grant select, insert, update, delete on public.exercises to service_role;

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
        on lower(btrim(teammate.clinic_name)) = lower(btrim(me.clinic_name))
      where me.user_id = auth.uid()
        and teammate.user_id = candidate
    );
$$;

revoke all on function public.same_clinic_therapist(uuid) from public, anon;
grant execute on function public.same_clinic_therapist(uuid) to authenticated, service_role;

create or replace function public.can_manage_patient_program(target_patient_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  ok boolean := false;
begin
  if target_patient_id is null or auth.uid() is null then
    return false;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'patients'
      and column_name = 'assigned_therapist_id'
  ) then
    execute $q$
      select exists (
        select 1
        from public.patients p
        where p.id = $1
          and (
            p.therapist_id = auth.uid()
            or p.assigned_therapist_id = auth.uid()
            or public.same_clinic_therapist(p.therapist_id)
            or public.same_clinic_therapist(p.assigned_therapist_id)
          )
      )
    $q$
    into ok
    using target_patient_id;
  else
    execute $q$
      select exists (
        select 1
        from public.patients p
        where p.id = $1
          and (
            p.therapist_id = auth.uid()
            or public.same_clinic_therapist(p.therapist_id)
          )
      )
    $q$
    into ok
    using target_patient_id;
  end if;

  return coalesce(ok, false);
end;
$$;

revoke all on function public.can_manage_patient_program(uuid) from public, anon;
grant execute on function public.can_manage_patient_program(uuid) to authenticated, service_role;

drop policy if exists "Therapists manage exercises for own patients" on public.exercises;
drop policy if exists "Therapists select clinic exercises" on public.exercises;
drop policy if exists "Therapists insert clinic exercises" on public.exercises;
drop policy if exists "Therapists update clinic exercises" on public.exercises;
drop policy if exists "Therapists delete clinic exercises" on public.exercises;
drop policy if exists exercises_service_role on public.exercises;
drop policy if exists exercises_clinic_select on public.exercises;
drop policy if exists exercises_clinic_insert on public.exercises;
drop policy if exists exercises_clinic_update on public.exercises;
drop policy if exists exercises_clinic_delete on public.exercises;
drop policy if exists exercises_clinic_all on public.exercises;

create policy exercises_service_role
  on public.exercises
  for all
  to service_role
  using (true)
  with check (true);

create policy exercises_clinic_select
  on public.exercises
  for select
  to authenticated
  using (public.can_manage_patient_program(patient_id));

create policy exercises_clinic_insert
  on public.exercises
  for insert
  to authenticated
  with check (public.can_manage_patient_program(patient_id));

create policy exercises_clinic_update
  on public.exercises
  for update
  to authenticated
  using (public.can_manage_patient_program(patient_id))
  with check (public.can_manage_patient_program(patient_id));

create policy exercises_clinic_delete
  on public.exercises
  for delete
  to authenticated
  using (public.can_manage_patient_program(patient_id));

alter table public.check_ins enable row level security;
alter table public.check_ins force row level security;

revoke all on public.check_ins from anon, public;
grant select, insert, update, delete on public.check_ins to authenticated;
grant select, insert, update, delete on public.check_ins to service_role;

drop policy if exists "Therapists manage check-ins for own patients" on public.check_ins;
drop policy if exists "Therapists select clinic check-ins" on public.check_ins;
drop policy if exists "Therapists insert clinic check-ins" on public.check_ins;
drop policy if exists "Therapists update clinic check-ins" on public.check_ins;
drop policy if exists "Therapists delete clinic check-ins" on public.check_ins;
drop policy if exists check_ins_service_role on public.check_ins;
drop policy if exists check_ins_clinic_select on public.check_ins;
drop policy if exists check_ins_clinic_insert on public.check_ins;
drop policy if exists check_ins_clinic_update on public.check_ins;
drop policy if exists check_ins_clinic_delete on public.check_ins;

create policy check_ins_service_role
  on public.check_ins
  for all
  to service_role
  using (true)
  with check (true);

create policy check_ins_clinic_select
  on public.check_ins
  for select
  to authenticated
  using (public.can_manage_patient_program(patient_id));

create policy check_ins_clinic_insert
  on public.check_ins
  for insert
  to authenticated
  with check (public.can_manage_patient_program(patient_id));

create policy check_ins_clinic_update
  on public.check_ins
  for update
  to authenticated
  using (public.can_manage_patient_program(patient_id))
  with check (public.can_manage_patient_program(patient_id));

create policy check_ins_clinic_delete
  on public.check_ins
  for delete
  to authenticated
  using (public.can_manage_patient_program(patient_id));

notify pgrst, 'reload schema';

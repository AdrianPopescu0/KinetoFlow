-- Actualizare pentru patient_notes deja creat: acces de clinică + updated_by.
-- Rulează în Supabase → SQL Editor dacă ai rulat deja sql/030_patient_notes.sql.

alter table public.patient_notes
  add column if not exists updated_by uuid;

comment on column public.patient_notes.updated_by is
  'Terapeutul care a salvat ultima dată notița (auth.uid()).';

drop policy if exists patient_notes_clinic on public.patient_notes;

do $$
declare
  has_assigned boolean;
  has_profiles boolean;
  pred text;
begin
  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'patients' and column_name = 'assigned_therapist_id'
  ) into has_assigned;

  select exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'clinic_profiles'
  ) into has_profiles;

  pred := 'p.therapist_id = auth.uid()';
  if has_assigned then
    pred := pred || ' or p.assigned_therapist_id = auth.uid()';
  end if;
  if has_profiles then
    pred := pred || $c$
      or exists (
        select 1
        from public.clinic_profiles owner_profile
        join public.clinic_profiles me
          on lower(btrim(me.clinic_name)) = lower(btrim(owner_profile.clinic_name))
        where owner_profile.user_id = p.therapist_id
          and me.user_id = auth.uid()
      )
    $c$;
    if has_assigned then
      pred := pred || $c$
        or exists (
          select 1
          from public.clinic_profiles owner_profile
          join public.clinic_profiles me
            on lower(btrim(me.clinic_name)) = lower(btrim(owner_profile.clinic_name))
          where owner_profile.user_id = p.assigned_therapist_id
            and me.user_id = auth.uid()
        )
      $c$;
    end if;
  end if;

  execute format(
    $p$
      create policy patient_notes_clinic
        on public.patient_notes
        for all
        to authenticated
        using (
          exists (
            select 1 from public.patients p
            where p.id = patient_notes.patient_id
              and (%s)
          )
        )
        with check (
          exists (
            select 1 from public.patients p
            where p.id = patient_notes.patient_id
              and (%s)
          )
        );
    $p$,
    pred,
    pred
  );
end $$;

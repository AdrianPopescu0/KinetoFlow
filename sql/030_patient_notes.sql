-- Notițe clinice: tabel dedicat, nu coloană pe `patients`.
-- Rulează în Supabase → SQL Editor. Nu se aplică automat la build-ul Vercel.
-- Ownership: patients.therapist_id (și assigned_therapist_id dacă există).
-- Nu folosește patients.user_id — coloana lipsește pe unele proiecte.

create table if not exists public.patient_notes (
  patient_id uuid primary key references public.patients (id) on delete cascade,
  notes text,
  updated_at timestamptz not null default now(),
  updated_by uuid
);

alter table public.patient_notes
  add column if not exists updated_by uuid;

create index if not exists patient_notes_updated_at_idx
  on public.patient_notes (updated_at);

comment on table public.patient_notes is
  'Notițe clinice ale fișei. Un rând per pacient (patient_id = FK).';

do $$
declare
  has_clinical_notes boolean;
  has_updated_at boolean;
begin
  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'patients'
      and column_name = 'clinical_notes'
  ) into has_clinical_notes;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'patients'
      and column_name = 'updated_at'
  ) into has_updated_at;

  if has_clinical_notes then
    if has_updated_at then
      insert into public.patient_notes (patient_id, notes, updated_at)
      select p.id, p.clinical_notes, coalesce(p.updated_at, now())
      from public.patients p
      where p.clinical_notes is not null
        and length(trim(p.clinical_notes)) > 0
      on conflict (patient_id) do nothing;
    else
      insert into public.patient_notes (patient_id, notes, updated_at)
      select p.id, p.clinical_notes, now()
      from public.patients p
      where p.clinical_notes is not null
        and length(trim(p.clinical_notes)) > 0
      on conflict (patient_id) do nothing;
    end if;
  end if;
end $$;

alter table public.patient_notes enable row level security;

revoke all on public.patient_notes from anon, public;
grant select, insert, update, delete on public.patient_notes to authenticated;
grant select, insert, update, delete on public.patient_notes to service_role;

drop policy if exists patient_notes_service_role on public.patient_notes;
create policy patient_notes_service_role
  on public.patient_notes
  for all
  to service_role
  using (true)
  with check (true);

-- Politica de cabinet: doar coloane care există pe patients.
drop policy if exists patient_notes_clinic on public.patient_notes;
do $$
declare
  has_assigned boolean;
  pred text;
begin
  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'patients'
      and column_name = 'assigned_therapist_id'
  ) into has_assigned;

  pred := 'p.therapist_id = auth.uid()';
  if has_assigned then
    pred := pred || ' or p.assigned_therapist_id = auth.uid()';
  end if;
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'clinic_profiles'
  ) then
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
            select 1
            from public.patients p
            where p.id = patient_notes.patient_id
              and (%s)
          )
        )
        with check (
          exists (
            select 1
            from public.patients p
            where p.id = patient_notes.patient_id
              and (%s)
          )
        );
    $p$,
    pred,
    pred
  );
end $$;

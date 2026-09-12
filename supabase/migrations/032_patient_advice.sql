-- Mesaj / sfat al kinetoterapeutului, vizibil în portalul pacientului.
-- Rulează în Supabase → SQL Editor. Nu se aplică automat la build-ul Vercel.
-- Un rând per pacient. Nu folosește patients.user_id.

alter table public.patients
  add column if not exists therapist_advice text;

create table if not exists public.patient_advice (
  patient_id uuid primary key references public.patients (id) on delete cascade,
  message text,
  updated_at timestamptz not null default now()
);

comment on table public.patient_advice is
  'Recomandare afișată pacientului la „Kinetoterapeutul tău”. Un rând per pacient.';

create index if not exists patient_advice_updated_at_idx
  on public.patient_advice (updated_at);

alter table public.patient_advice enable row level security;

revoke all on public.patient_advice from anon, public;
grant select, insert, update, delete on public.patient_advice to authenticated;
grant select, insert, update, delete on public.patient_advice to service_role;

drop policy if exists patient_advice_service_role on public.patient_advice;
create policy patient_advice_service_role
  on public.patient_advice
  for all
  to service_role
  using (true)
  with check (true);

drop policy if exists patient_advice_clinic on public.patient_advice;
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
      create policy patient_advice_clinic
        on public.patient_advice
        for all
        to authenticated
        using (
          exists (
            select 1
            from public.patients p
            where p.id = patient_advice.patient_id
              and (%s)
          )
        )
        with check (
          exists (
            select 1
            from public.patients p
            where p.id = patient_advice.patient_id
              and (%s)
          )
        );
    $p$,
    pred,
    pred
  );
end $$;

-- Notițe clinice: tabel dedicat, nu coloană pe `patients`.
-- Rulează în Supabase → SQL Editor. Nu se aplică automat la build-ul Vercel.
-- Rezolvă: Could not find the 'clinical_notes' column of 'patients' in the schema cache.

create table if not exists public.patient_notes (
  patient_id uuid primary key references public.patients (id) on delete cascade,
  notes text,
  updated_at timestamptz not null default now()
);

create index if not exists patient_notes_updated_at_idx
  on public.patient_notes (updated_at);

comment on table public.patient_notes is
  'Notițe clinice ale fișei. Un rând per pacient (patient_id = FK).';

-- Dacă există încă coloana veche pe patients, copiază conținutul o dată.
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'patients'
      and column_name = 'clinical_notes'
  ) then
    insert into public.patient_notes (patient_id, notes, updated_at)
    select
      p.id,
      p.clinical_notes,
      coalesce(p.updated_at, now())
    from public.patients p
    where p.clinical_notes is not null
      and length(trim(p.clinical_notes)) > 0
    on conflict (patient_id) do nothing;
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

drop policy if exists patient_notes_clinic on public.patient_notes;
create policy patient_notes_clinic
  on public.patient_notes
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.patients p
      where p.id = patient_notes.patient_id
        and (
          p.therapist_id = auth.uid()
          or p.assigned_therapist_id = auth.uid()
          or p.user_id = auth.uid()
        )
    )
  )
  with check (
    exists (
      select 1
      from public.patients p
      where p.id = patient_notes.patient_id
        and (
          p.therapist_id = auth.uid()
          or p.assigned_therapist_id = auth.uid()
          or p.user_id = auth.uid()
        )
    )
  );

-- KinetoFlow — finalizări zilnice de exerciții (portal pacient, fără Auth)
-- Rulează în Supabase: SQL Editor → New query → Run

create table if not exists public.exercise_completions (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  exercise_id uuid not null references public.exercises (id) on delete cascade,
  completed_on date not null,
  created_at timestamptz not null default now(),
  constraint exercise_completions_unique_day unique (patient_id, exercise_id, completed_on)
);

create index if not exists exercise_completions_patient_day_idx
  on public.exercise_completions (patient_id, completed_on);

create index if not exists exercise_completions_exercise_id_idx
  on public.exercise_completions (exercise_id);

alter table public.exercise_completions enable row level security;
alter table public.exercise_completions force row level security;

revoke all on public.exercise_completions from anon, public;
grant select, delete on public.exercise_completions to authenticated;
-- INSERT/UPDATE rămân pe service_role (portalul pacientului nu are sesiune Auth)

drop policy if exists "Therapists select clinic exercise completions" on public.exercise_completions;
create policy "Therapists select clinic exercise completions"
  on public.exercise_completions
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.patients p
      where p.id = exercise_completions.patient_id
        and (
          p.therapist_id = auth.uid()
          or p.assigned_therapist_id = auth.uid()
          or public.same_clinic_therapist(p.therapist_id)
        )
    )
  );

drop policy if exists "Therapists delete clinic exercise completions" on public.exercise_completions;
create policy "Therapists delete clinic exercise completions"
  on public.exercise_completions
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.patients p
      where p.id = exercise_completions.patient_id
        and (
          p.therapist_id = auth.uid()
          or p.assigned_therapist_id = auth.uid()
          or public.same_clinic_therapist(p.therapist_id)
        )
    )
  );

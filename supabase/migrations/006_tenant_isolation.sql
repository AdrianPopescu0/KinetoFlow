-- Izolare multi-tenant: fiecare cabinet vede doar propriii pacienți.
-- Copiază tot fișierul în Supabase: SQL Editor → New query → Run
--
-- user_id = auth.uid() (același ca clinic_profiles.user_id).
-- public.exercises = programul asignat pacientului → RĂMÂNE izolat.
-- Biblioteca de exerciții din aplicație (catalogul KinetoFlow) nu e în această tabelă
-- și rămâne comună pentru toți terapeuții autentificați (vezi exercise_library).

-- 1) Coloană de tenancy pe patients
alter table public.patients
  add column if not exists user_id uuid references auth.users (id) on delete cascade;

update public.patients
set user_id = therapist_id
where user_id is null and therapist_id is not null;

alter table public.patients
  alter column user_id set not null;

create index if not exists patients_user_id_idx on public.patients (user_id);

-- 2) La insert/update din sesiune autentificată, forțează user_id = auth.uid()
create or replace function public.patients_enforce_tenant()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null then
    if tg_op = 'INSERT' then
      new.user_id := auth.uid();
      new.therapist_id := auth.uid();
    elsif tg_op = 'UPDATE' then
      new.user_id := old.user_id;
      new.therapist_id := old.therapist_id;
    end if;
  else
    if new.user_id is null and new.therapist_id is not null then
      new.user_id := new.therapist_id;
    end if;
    if new.therapist_id is null and new.user_id is not null then
      new.therapist_id := new.user_id;
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

-- 3) RLS forțat (chiar și pentru roluri privilegiate care nu sunt table owner)
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

-- Pacienți: doar cabinetul curent
drop policy if exists "Therapists manage own patients" on public.patients;
create policy "Therapists manage own patients"
  on public.patients
  for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Exerciții asignate pacientului (NU biblioteca): doar dacă pacientul e al cabinetului
drop policy if exists "Therapists manage exercises for own patients" on public.exercises;
create policy "Therapists manage exercises for own patients"
  on public.exercises
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.patients p
      where p.id = exercises.patient_id
        and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.patients p
      where p.id = exercises.patient_id
        and p.user_id = auth.uid()
    )
  );

drop policy if exists "Therapists manage check-ins for own patients" on public.check_ins;
create policy "Therapists manage check-ins for own patients"
  on public.check_ins
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.patients p
      where p.id = check_ins.patient_id
        and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.patients p
      where p.id = check_ins.patient_id
        and p.user_id = auth.uid()
    )
  );

-- 4) Bibliotecă comună de exerciții (catalog clinic, fără date de pacient)
create table if not exists public.exercise_library (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  region text,
  video_url text,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.exercise_library enable row level security;

drop policy if exists "Authenticated read exercise library" on public.exercise_library;
create policy "Authenticated read exercise library"
  on public.exercise_library
  for select
  to authenticated
  using (true);

grant select on public.exercise_library to authenticated;
revoke all on public.exercise_library from anon, public;

notify pgrst, 'reload schema';

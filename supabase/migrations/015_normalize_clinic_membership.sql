-- KinetoFlow — apartenența la clinică este clinic_name, nu clinic_id.
-- Uniformizează scrierea după profilul adminului (ex. KInetoKlinik / KinetoKlinik).

update public.clinic_profiles member
set clinic_name = admin.clinic_name
from public.clinic_profiles admin
where admin.role = 'admin'
  and member.user_id <> admin.user_id
  and lower(btrim(member.clinic_name)) = lower(btrim(admin.clinic_name))
  and member.clinic_name is distinct from admin.clinic_name;

drop policy if exists "Clinic members read clinic profiles" on public.clinic_profiles;
create policy "Clinic members read clinic profiles"
  on public.clinic_profiles
  for select
  to authenticated
  using (
    user_id = auth.uid()
    or lower(btrim(clinic_name)) = (
      select lower(btrim(me.clinic_name))
      from public.clinic_profiles me
      where me.user_id = auth.uid()
      limit 1
    )
  );

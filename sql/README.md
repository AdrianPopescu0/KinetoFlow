# Scripturi SQL manuale

Aceste fișiere **nu** se rulează la build-ul Vercel. Le lipești în **Supabase → SQL Editor**.

- `018_exercise_library_rls.sql` — RLS inițial pe `exercise_library`
- `019_exercise_library_editor.sql` — funcția de editor
- `020_create_exercise_library.sql` — creează tabela dacă lipsește
- `021_exercise_library_editors.sql` — scriere doar pentru `kinetic01flow@gmail.com` și `admin@kinetoflow.ro`
- `022_patient_notify_channel.sql` — coloana `patients.notify_channel` (`whatsapp` | `sms`) pentru canalul de invitație; reminder-ele de check-in merg doar prin push FCM
- `023_patient_push_tokens.sql` — FCM web push
- `030_patient_notes.sql` — notițe clinice (`patient_notes.patient_id` → `patients.id`; **nu** coloana `patients.clinical_notes`)
- `031_patient_notes_clinic.sql` — acces pentru toți terapeuții din același cabinet + coloana `updated_by`

# KinetoFlow

Aplicație clinică pentru kinetoterapie. Acest depozit include modulul de **autentificare securizată** (login) pe Next.js App Router, TypeScript, Tailwind CSS și Supabase Auth (`@supabase/ssr`).

## Cerințe

- Node.js 20+
- Un proiect [Supabase](https://supabase.com) cu Auth activat

## Configurare

1. Copiază variabilele de mediu:

```bash
cp .env.example .env.local
```

2. Completează în `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL` — URL-ul proiectului (Settings → API)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — cheia anonimă / publicabilă (`sb_publishable_…`)
- `SUPABASE_SERVICE_ROLE_KEY` — cheia secretă / service role, doar pe server (**fără** `NEXT_PUBLIC_`)
- `NEXT_PUBLIC_SITE_URL` — originea publică a aplicației (invitații terapeuți `/auth/activare` și recuperare parolă). Nu folosi un URL de preview Vercel (`*-git-*.vercel.app`).
- `CRON_SECRET` — secret pentru cron-uri (`Authorization: Bearer …` pe `/api/cron/reset-daily-progress`, `/api/cron/reminders` și `/api/cron/daily-update`); pe Vercel, dacă e setat, header-ul e trimis automat
- Opțional, pentru reminder-e SMS: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` și `TWILIO_PHONE_NUMBER` (E.164, ex. `+4915888623971`, fără `whatsapp:`). Alias-uri acceptate: `TWILIO_SMS_FROM`, `TWILIO_FROM`.
- Opțional, pentru reminder-e **push** (Firebase Cloud Messaging): cheile `NEXT_PUBLIC_FIREBASE_*` (inclusiv `NEXT_PUBLIC_FIREBASE_VAPID_KEY`) plus pe server `FIREBASE_SERVICE_ACCOUNT` sau `FIREBASE_PROJECT_ID` + `FIREBASE_CLIENT_EMAIL` + `FIREBASE_PRIVATE_KEY`. Fără acestea, cron-ul rămâne pe SMS (și local simulează push-ul).

În dashboard-ul Supabase, **Authentication → Providers → Email** trebuie să fie activ. Pentru fluxul de onboarding imediat după înregistrare, dezactivează „Confirm email” (sau lasă-l activ — utilizatorul confirmă din email și apoi intră în cont).

Adaugă URL-urile de redirect pentru recuperarea parolei și invitațiile WhatsApp:

- `http://localhost:43123/auth/callback`
- `http://127.0.0.1:43123/auth/callback`
- domeniul de producție + `/auth/callback`
- domeniul de producție + `/auth/callback?next=/auth/set-password`
- domeniul de producție + `/auth/activare`

3. Instalează dependențele și pornește serverul de dezvoltare:

```bash
npm install
npm run dev -- --port 43123 --hostname 127.0.0.1
```

Deschide [http://127.0.0.1:43123/login](http://127.0.0.1:43123/login) sau programul pacient [http://127.0.0.1:43123/patient/demo](http://127.0.0.1:43123/patient/demo).

## Autentificare

| Rută | Rol |
| --- | --- |
| `/login` | Intră în cont (`?mode=signin`) sau înregistrează clinică (`?mode=signup`); la signup e obligatoriu consimțământul la Termeni și Politica de Confidențialitate |
| `/termeni` | Termeni și Condiții (inclusiv disclaimer medical) |
| `/confidentialitate` | Politica de Confidențialitate și prelucrare date (GDPR) |
| `/onboarding` | Configurare clinică (obligatorie înainte de dashboard) |
| `/recuperare-parola` | Cerere de resetare a parolei |
| `/dashboard` | Zonă protejată (doar utilizatori autentificați) |
| `/dashboard/exercises` | Bibliotecă de exerciții (taxonomie clinică, mock catalog) |
| `/auth/callback` | Schimb `code` (PKCE) sau `token_hash` (recovery) → sesiune, apoi redirect |
| `/auth/activare` | Pagină intermediară pentru invitația WhatsApp (OTP-ul nu se arde la preview) |
| `/auth/set-password` | Noul terapeut își alege parola după confirmarea invitației |
| `/acces` | Login pacient: telefon + cod 8 cifre (opțional, dacă nu ai linkul cu token) |
| `/patient/[token]` | Programul public al pacientului. Tokenul valid se salvează imediat în `localStorage` și într-un cookie de sesiune; `/p/[token]` rămâne echivalent |
| `/patient` | Recuperează tokenul din stocare dacă un webview (WhatsApp/Facebook) a tăiat parametrii din URL |

## Schema pacienți

În Supabase: **SQL Editor** → lipește și rulează `supabase/migrations/001_patients.sql`.

Tabele: `patients` (token UUID unic pentru `/patient/[token]`; **fără** coloana `clinic_id` — cabinetul e `therapist_id` + `clinic_profiles.clinic_name`; `notify_channel` = SMS Twilio, rulează `sql/022_patient_notify_channel.sql`), `patient_push_tokens` (FCM web push — rulează `sql/023_patient_push_tokens.sql`), `exercises`, `check_ins`, `exercise_completions` (finalizări zilnice din portalul pacientului — rulează `016_exercise_completions.sql`). Biblioteca din aplicație (`/dashboard/exercises`) rămâne comună; `exercise_library` e catalog, fără date de pacient. Dacă lipsește tabela, rulează `sql/020_create_exercise_library.sql`, apoi `sql/021_exercise_library_editors.sql` în SQL Editor (nu la build-ul Vercel): SELECT pentru oricine; INSERT/UPDATE/DELETE doar pentru `kinetic01flow@gmail.com` și `admin@kinetoflow.ro`.

Fișa clinică: `/dashboard/patients/[id]`. La salvare, aplicația compară `updated_at` cu momentul deschiderii ecranului; dacă altcineva a modificat fișa, terapeutul e avertizat și poate reîncărca datele. Rulează `supabase/migrations/009_patients_updated_at.sql`. Asignare terapeut: `010_assigned_therapist.sql` (`assigned_therapist_id`). Note clinice: `002_clinical_notes.sql`. Cod de acces 8 cifre: `003_access_code.sql`. Email-ul pacientului e opțional; telefonul e obligatoriu la pacienți noi.

Profil clinică (onboarding): rulează `supabase/migrations/004_clinic_profiles.sql`, apoi `017_clinic_profiles_rls.sql` în SQL Editor. Ultima migrare permite INSERT doar când `auth.uid() = user_id` și elimină recursia din politica de citire a colegilor. Coloane: `id`, `user_id` (= `auth.uid()`), `clinic_name`, `therapist_name`, `phone`, `role` (`admin` | `therapist`). Colegii din același cabinet se leagă prin `clinic_name` (nu există `clinic_id` pe această tabelă). Invitare colegi: `011_clinic_roles.sql`. Fără rând în `clinic_profiles`, terapeutul e redirecționat la `/onboarding`. Doar `admin` vede Administrare Echipă și butonul „Adaugă Terapeut”.

Formularul de suport din footer: rulează `supabase/migrations/007_support_tickets.sql`. Tabela `support_tickets` (id, name, contact, message, created_at, status) primește inserări publice; citirea nu e permisă din aplicație. După salvare, serverul trimite o notificare prin [Resend](https://resend.com) către `SUPPORT_NOTIFY_EMAIL` (implicit `kinetic01flow@gmail.com`). Fără `RESEND_API_KEY`, tichetul se salvează oricum; utilizatorul vede confirmarea chiar dacă emailul eșuează.

Reguli de securitate aplicate:

- Validare pe server pentru email și parolă înainte de apelul Auth
- La înregistrare, parola trebuie: 8+ caractere, o majusculă, o cifră, un caracter special
- Mesaj generic la eșec: „Email sau parolă incorectă” (fără enumerarea utilizatorilor)
- Middleware care reîmprospătează sesiunea, blochează `/dashboard/*` pentru vizitatori și trimite la `/onboarding` dacă lipsește `clinic_profiles`
- Verificare `getUser()` (nu `getSession()`) pentru autorizare
- RLS pe `patients`: vizibil dacă `therapist_id` / `assigned_therapist_id` e al tău sau al unui coleg cu același `clinic_name` (`013_patients_no_clinic_id.sql`)
- RLS pe `exercise_library`: citire pentru oricine; scriere (INSERT/UPDATE/DELETE) doar `kinetic01flow@gmail.com` și `admin@kinetoflow.ro` (email exact). Scripturile sunt în `sql/`, nu se aplică automat pe Vercel. Tabela `exercises` (programul pacientului) rămâne editabilă de terapeuții cabinetului.

## Cron zilnic (Hobby: un singur job)

Planul Vercel Hobby permite **un singur cron, o dată pe zi**. `vercel.json` are deci o singură rută: `/api/cron/reset-daily-progress` la **22:00 UTC** ≈ **00:00 România**.

- iarnă (EET, UTC+2): 22:00 UTC = **00:00** România
- vară (EEST, UTC+3): 22:00 UTC = **01:00** România (ziua nouă a început deja)

Job-ul **resetează progresul zilnic** al exercițiilor (`exercise_completions`):

- Marcajele „Efectuat” sunt pe dată (`completed_on`). Ziua nouă pornește fără bifă — nu se copiază finalizările de ieri.
- Recalculează setul activ după perioada din `notes` (`Perioadă tratament: DD.MM.YYYY – DD.MM.YYYY`).
- Șterge finalizările legate de exerciții inactive.
- Protejat cu `Authorization: Bearer ${CRON_SECRET}`. Fără secret sau header greșit → 401.

Trigger manual: `GET /api/cron/reset-daily-progress?force=1` cu `Authorization: Bearer ${CRON_SECRET}`. Alias-uri: `/api/cron/daily?task=program&force=1`, `/api/cron/daily-update`.

Reminder-ul de check-in de la 18:00 **nu** poate rula în același cron Hobby (ar trebui o a doua declanșare). Rămâne pe `/api/cron/reminders` (sau `?task=reminders` pe `/api/cron/daily`) pentru trigger manual, cron extern sau plan Pro.

Dacă pacientul a activat notificările push, cron-ul trimite **FCM** către tokenul salvat (`patient_push_tokens`) în loc de SMS/WhatsApp. Fără token (sau dacă FCM eșuează), rămâne fallback-ul SMS Twilio.

## Notificări push (Firebase Cloud Messaging)

1. Creează un proiect Firebase, activează **Cloud Messaging** și o aplicație Web.
2. În Firebase Console → Project settings → Cloud Messaging, generează un **Web Push certificate** și copiază **cheia publică** (nu pe cea privată) în `NEXT_PUBLIC_FIREBASE_VAPID_KEY`.
3. Pe Vercel (și în `.env.local`) pune cheile **cu prefix `NEXT_PUBLIC_`**: `API_KEY`, `AUTH_DOMAIN`, `PROJECT_ID`, `STORAGE_BUCKET`, `MESSAGING_SENDER_ID`, `APP_ID`, `VAPID_KEY`. Alias-uri: `NEXT_PUBLIC_FIREBASE_SENDER_ID`, `NEXT_PUBLIC_FIREBASE_MESSAGING_VAPID_KEY`. După ce le adaugi, **redesfășoară** aplicația (cheile publice se citesc la build). Pe server: `FIREBASE_SERVICE_ACCOUNT` sau `FIREBASE_PROJECT_ID` + `FIREBASE_CLIENT_EMAIL` + `FIREBASE_PRIVATE_KEY`.
4. În Supabase SQL Editor rulează `sql/023_patient_push_tokens.sql`.
5. Pacientul, la primul acces în `/patient/[token]`, vede ecranul de onboarding și poate activa notificările. Tokenul se salvează prin `POST /api/patient/push-token`. Service worker: `public/firebase-messaging-sw.js`. Config client: `lib/firebase.ts`.

Fără credențiale Firebase, aplicația rămâne utilizabilă: onboarding-ul apare, iar pe serverul de dezvoltare trimiterea push e simulată în loguri.

Trigger manual program: `GET /api/cron/reset-daily-progress?force=1` cu `Authorization: Bearer ${CRON_SECRET}`. Alias: `/api/cron/daily-update` și `/api/cron/daily?task=program&force=1`. Reminder: `?task=reminders&force=1` sau `/api/cron/reminders?force=1`. Previzualizare reminder: `?dryRun=1`.

## Structură relevantă

```
src/utils/supabase/client.ts     # createBrowserClient (@supabase/ssr)
src/utils/supabase/server.ts     # createServerClient + cookies
src/utils/supabase/middleware.ts # refresh sesiune + protecție /dashboard
src/utils/supabase/admin.ts      # client service role (doar server)
middleware.ts                    # Next.js middleware
app/login/actions.ts             # Server Action login()
app/login/page.tsx               # UI login split-screen
app/dashboard/page.tsx           # Dashboard terapeut (protejat)
components/InstallPWAButton.tsx  # Buton instalare PWA (beforeinstallprompt; nu apare pe iOS)
app/patient/[token]/page.tsx     # Programul public al pacientului
app/patient/page.tsx             # Recuperare token (webview fără parametri)
app/p/[patientToken]/page.tsx    # Alias vechi al programului pacientului
app/api/cron/reset-daily-progress/route.ts # Cron 00:00 RO: reset progres exerciții (Bearer CRON_SECRET)
app/api/cron/daily/route.ts      # Umbrella: program la miezul nopții + reminder (manual / Pro)
app/api/cron/reminders/route.ts  # Reminder check-in 18:00 (manual / Pro / cron extern)
app/api/cron/daily-update/route.ts # Alias manual pentru resetul de program
vercel.json                      # un singur cron: 22:00 UTC → /api/cron/reset-daily-progress
public/manifest.webmanifest      # PWA: standalone + iconițe 192/512
```

## Instalare PWA (Android / Chrome / Edge)

Butonul **Instalează Aplicația KinetoFlow** apare în header-ul programului pacientului doar dacă browserul emite `beforeinstallprompt` (Chrome/Edge pe Android sau desktop). Safari pe iOS nu emite evenimentul, deci butonul rămâne ascuns. După instalare sau dacă aplicația rulează deja standalone, butonul dispare.

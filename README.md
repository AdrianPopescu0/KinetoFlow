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
- `NEXT_PUBLIC_SITE_URL` — originea publică **opțională**. Loginul, OAuth și callback-ul folosesc originea request-ului (`x-forwarded-host` / `window.location.origin`). URL-urile `*.vercel.app` sunt ignorate; în producție fallback-ul e `https://kinetoflow.ro`. Nu pune aici un host Vercel.
- `CRON_SECRET` — secret pentru cron-uri (`Authorization: Bearer …` pe `/api/cron/reset-daily-progress`, `/api/cron/reminders` și `/api/cron/daily-update`); pe Vercel, dacă e setat, header-ul e trimis automat
- `EARLY_ACCESS_CODE` — **exact 12 caractere**. Codul secret pentru butonul Early Access de pe landing. Dacă lipsește sau nu are 12 caractere, local se folosește `KINETO-EARLY`. Pe producție puneți propriul cod. Opțional: `EARLY_ACCESS_PEPPER` pentru semnarea cookie-ului.
- Pentru **emailuri OTP** (înregistrare clinică + invitație) și suport: `RESEND_API_KEY` — **obligatoriu în producție**. Codul de 6 cifre NU trece prin `signInWithOtp` / `auth.resend` / mailer-ul de test Supabase; e mintuit cu `generateLink` și trimis de Resend de pe `no-reply@kinetoflow.ro` (`RESEND_AUTH_FROM`). Fără cheie, local codul e doar logat. Mailer-ul built-in din Authentication → Emails are rate limit mic și nu livrează aceste OTP-uri; pentru recovery Auth pune SMTP propriu (Resend/SendGrid/Gmail).
- Pentru reminder-e și notificări de check-in (**doar Web Push / FCM**): cheile `NEXT_PUBLIC_FIREBASE_*` (inclusiv `NEXT_PUBLIC_FIREBASE_VAPID_KEY`) plus pe server **`FIREBASE_SERVICE_ACCOUNT`** (JSON-ul complet al contului de serviciu, `JSON.parse`). Fără token FCM salvat, reminder-ul se sare — nu există fallback SMS sau WhatsApp. Local, fără Firebase Admin, trimiterea push e simulată în loguri.

În dashboard-ul Supabase, **Authentication → Providers → Email** trebuie să fie activ. **Confirm email** poate rămâne pornit: OTP-ul de 6 cifre se cere **doar la prima înregistrare**. După ce utilizatorul îl tastează în `/auth/email-cod`, serverul confirmă adresa cu `verifyOtp` pe același dispozitiv. Logările ulterioare folosesc `signInWithPassword` (email + parolă) și nu mai trimit niciun cod. Nu există buton de confirmare în email care să mute sesiunea pe telefonul de pe care s-a deschis inbox-ul. Pentru **Google**, activează providerul Google (Client ID + secret din Google Cloud Console). Redirect-ul din consola Google este `https://<proiect>.supabase.co/auth/v1/callback`; în aplicație, după OAuth, utilizatorul revine pe `/auth/callback`.

Adaugă URL-urile de redirect pentru recuperarea parolei și invitațiile WhatsApp:

- `http://localhost:43123/auth/callback`
- `http://127.0.0.1:43123/auth/callback`
- `https://kinetoflow.ro/auth/callback`
- `https://kinetoflow.ro/auth/callback?next=/auth/set-password`
- `https://kinetoflow.ro/auth/callback?next=/dashboard` (inclusiv `?invite=` pentru invitațiile de terapeut)
- `https://kinetoflow.ro/auth/activare`

În Supabase, **Authentication → URL Configuration**: Site URL trebuie să fie `https://kinetoflow.ro` (nu `*.vercel.app`). Aceleași URL-uri de mai sus stau și la Redirect URLs.

3. Instalează dependențele și pornește serverul de dezvoltare:

```bash
npm install
npm run dev -- --port 43123 --hostname 127.0.0.1
```

Deschide [http://127.0.0.1:43123](http://127.0.0.1:43123/) (Early Access), apoi după cod [http://127.0.0.1:43123/login](http://127.0.0.1:43123/login) pentru autentificarea clasică, sau programul pacient [http://127.0.0.1:43123/patient/demo](http://127.0.0.1:43123/patient/demo).

## Autentificare

| Rută | Rol |
| --- | --- |
| `/` | Landing de prezentare: un singur buton **Early Access** deschide formularul de cod (12 caractere). Fără cumpărare abonament. |
| `/early-access` | Pagină dedicată pentru același cod; middleware trimite aici `/login`, `/register`, `/recuperare-parola` și `/early-access/cont` dacă lipsește cookie-ul valid. Portalul pacient (`/acces`) rămâne public. |
| `/early-access/cont` | Redirect către `/login` (păstrat pentru bookmark-uri vechi). |
| `/login` | Interfața clasică: **Google**, apoi email + parolă. Tab-uri **Intră în cont** / **Înregistrează clinică nouă**. La **înregistrare**, aplicația trimite un **cod de 6 cifre** și deschide `/auth/email-cod`. La **Sign In**, un cont deja confirmat merge direct în dashboard/onboarding, fără OTP. La signup e obligatoriu consimțământul la Termeni. |
| `/auth/email-cod` | Ecran de confirmare **doar pentru înregistrare**: utilizatorul tastează manual codul de 6 cifre. Validarea e `verifyOtp` pe dispozitivul de pe care a început înregistrarea; linkurile din email nu mai autentifică automat. Accesul cu `purpose=login` redirecționează la Sign In. |
| `/termeni` | Termeni și Condiții (inclusiv disclaimer medical) |
| `/confidentialitate` | Politica de Confidențialitate și prelucrare date (GDPR) |
| `/onboarding` | Configurare clinică (doar pentru administratori **fără** invitație pending). Dacă există token în `localStorage` **sau** o invitație / rând pending cu același email Google, pagina asociază `user_id`-ul și redirecționează la `/dashboard`, fără formularul de cabinet nou. |
| `/recuperare-parola` | Cerere de resetare a parolei |
| `/dashboard` | Zonă protejată (doar utilizatori autentificați) |
| `/dashboard/setari` | Setări cont: date personale, parolă și preferințe de profil |
| `/dashboard/exercises` | Bibliotecă de exerciții (taxonomie clinică, mock catalog) |
| `/auth/callback` | Schimb `code` (PKCE) sau `token_hash` (recovery) → sesiune, apoi redirect |
| `/auth/invitatie/[token]` | Link unic din WhatsApp/SMS. La înregistrarea cu email și parolă, Server Action-ul citește tokenul din URL, trimite un **OTP de 6 cifre** și afișează ecranul de confirmare pe aceeași pagină. După `verifyOtp`, se inserează `clinic_profiles`, invitația e marcată `accepted_at`, iar terapeutul e dus **direct în `/dashboard`**. Logările ulterioare sunt doar email + parolă, fără OTP. **Google:** după OAuth, înainte de a verifica dacă `user_id`-ul nou are clinică, se caută invitația pending după token **sau** după emailul Google (rândul creat de admin). Dacă există, se face **UPDATE** pe rândul existent (`accepted_user_id` = noul `user_id`, `accepted_at`) și terapeutul merge la `/dashboard`, **fără `/onboarding`**. |
| `/auth/activare` | Pagină intermediară pentru invitațiile vechi (recovery Supabase) |
| `/auth/set-password` | Setare parolă după invitațiile vechi |
| `/acces` | Login pacient: telefon + cod 8 cifre (opțional, dacă nu ai linkul cu token) |
| `/patient/[token]` | Programul public al pacientului. Tokenul valid se salvează imediat în `localStorage` și într-un cookie de sesiune; `/p/[token]` rămâne echivalent |
| `/patient` | Recuperează tokenul din stocare dacă un webview (WhatsApp/Facebook) a tăiat parametrii din URL |

## Schema pacienți

În Supabase: **SQL Editor** → lipește și rulează `supabase/migrations/001_patients.sql`.

Tabele: `patients` (token UUID unic pentru `/patient/[token]`; **fără** coloana `clinic_id` — cabinetul e `therapist_id` + `clinic_profiles.clinic_name`; `notify_channel` = preferință invitație WhatsApp/SMS, rulează `sql/022_patient_notify_channel.sql`; reminder-ele de check-in **nu** folosesc această coloană), `patient_push_tokens` (FCM web push — rulează `sql/023_patient_push_tokens.sql`), `exercises`, `check_ins` (durata ședinței: `exercise_duration_seconds`, rulează `018_checkin_exercise_duration.sql`; un check-in pe zi: `local_date` + index unic, rulează `sql/028_check_ins_one_per_day.sql`), `exercise_completions` (finalizări zilnice din portalul pacientului — rulează `016_exercise_completions.sql`). Biblioteca din aplicație (`/dashboard/exercises`) rămâne comună; `exercise_library` e catalog, fără date de pacient. Dacă lipsește tabela, rulează `sql/020_create_exercise_library.sql`, apoi `sql/021_exercise_library_editors.sql` în SQL Editor (nu la build-ul Vercel): SELECT pentru oricine; INSERT/UPDATE/DELETE doar pentru `kinetic01flow@gmail.com` și `admin@kinetoflow.ro`. Regiunea, obiectivul și echipamentul acceptă mai multe id-uri despărțite prin virgulă; `sql/024_exercise_library_multi_tags.sql` documentează coloanele. Pentru liste lungi (dashboard, bibliotecă, check-in-uri), rulează `sql/025_list_query_indexes.sql` — indecși idempotenți, fără schimbare de date.

Fișa clinică: `/dashboard/patients/[id]`. La salvare, aplicația compară `updated_at` cu momentul deschiderii ecranului; dacă altcineva a modificat fișa, terapeutul e avertizat și poate reîncărca datele. Rulează `supabase/migrations/009_patients_updated_at.sql`. Asignare terapeut: `010_assigned_therapist.sql` (`assigned_therapist_id`). Note clinice: `002_clinical_notes.sql`. Cod de acces 8 cifre: `003_access_code.sql`. Email-ul pacientului e opțional; telefonul e obligatoriu la pacienți noi.

Profil clinică (onboarding): rulează `supabase/migrations/004_clinic_profiles.sql`, apoi `017_clinic_profiles_rls.sql` în SQL Editor. Ultima migrare permite INSERT doar când `auth.uid() = user_id` și elimină recursia din politica de citire a colegilor. Coloane: `id`, `user_id` (= `auth.uid()`), `clinic_name`, `therapist_name`, `phone`, `role` (`admin` | `therapist`). Colegii din același cabinet se leagă prin `clinic_name` (nu există `clinic_id` pe această tabelă). **Invitare colegi:** adminul introduce nume, telefon și, opțional, **emailul Google**; aplicația salvează un rând în `therapist_invites` (rulează `sql/027_therapist_invites.sql`; dacă tabela există deja fără coloana `email`, rulează `sql/029_therapist_invites_email.sql` în SQL Editor, nu la build-ul Vercel) și generează `/auth/invitatie/<token>`. Modalul oferă WhatsApp Web, aplicație, SMS și copiere. Terapeutul deschide linkul, continuă cu Google sau își pune emailul și parola și își creează contul singur; adminul **nu** mai creează un user Auth dinainte. La Google, asocierea e pe emailul pending: nu se inserează un al doilea rând de invitație și nu se deschide onboarding-ul. Doar `admin` vede Administrare Echipă, butonul „Adaugă Terapeut” (pe pagina de echipă, nu în header) și **Ștergere** (doar pe rândurile de terapeut, cu `window.confirm` înainte de a scoate contul din Auth). Pacienții acelui terapeut sunt reasignați adminului, ca să nu se șteargă odată cu `auth.users`.

Formularul de suport din footer: rulează `supabase/migrations/007_support_tickets.sql`. Tabela `support_tickets` (id, name, contact, message, created_at, status) primește inserări publice; citirea nu e permisă din aplicație. După salvare, serverul trimite o notificare prin [Resend](https://resend.com) către `SUPPORT_NOTIFY_EMAIL` (implicit `kinetic01flow@gmail.com`). Fără `RESEND_API_KEY`, tichetul se salvează oricum; utilizatorul vede confirmarea chiar dacă emailul eșuează.

OTP de confirmare email (doar la înregistrare, inclusiv terapeuți invitați): rulează `sql/026_auth_email_otps.sql` (sau `supabase/migrations/019_auth_email_otps.sql`). Fluxul **nu** apelează `signInWithOtp` și **nu** apelează `auth.resend`. Serverul:

1. mintuiește OTP-ul cu `auth.admin.generateLink` (`signup` / `magiclink` / `recovery`) — **fără** trimitere de email;
2. livrează mesajul prin **Resend** `emails.send` de pe `KinetoFlow <no-reply@kinetoflow.ro>` (`RESEND_AUTH_FROM`), doar text cu 6 cifre, fără buton de autologin.

Erorile de la Resend sau GoTrue (SMTP, `429` / rate limit, cheie lipsă) sunt prinse în `try/catch`, logate cu prefix `[auth-otp]` în consola serverului și afișate în UI. Fără `RESEND_API_KEY`, în dezvoltare codul e logat și întors ca `devCode`; în producție trimiterea eșuează vizibil. Mailer-ul built-in Supabase **nu** e folosit pentru acest OTP — pe planul gratuit e un inbox de test, cu limită de câteva emailuri pe oră, și adesea nu ajunge la Gmail. Pentru template-urile Auth (recuperare parolă), configurează SMTP propriu în **Authentication → Emails → SMTP Settings** (Resend `smtp.resend.com:465`, SendGrid sau Gmail App Password). Verifică domeniul `kinetoflow.ro` în Resend înainte de producție.

Utilizatorul tastează codul pe `/auth/email-cod` (clinică nouă) sau pe `/auth/invitatie/[token]` (invitație). Backend-ul apelează `supabase.auth.verifyOtp({ email, token, type: "signup" | "email" | "magiclink" | "invite" | "recovery" })`. După confirmarea invitației, se scrie `clinic_profiles` și invitația e marcată acceptată; destinația e `/dashboard`. `POST /api/auth/email-otp` primește `{ email, purpose: "register" }` — `purpose: "login"` este respins. Conturile confirmate se autentifică cu `signInWithPassword`, fără un al doilea cod.

Reguli de securitate aplicate:

- Validare pe server pentru email și parolă înainte de apelul Auth
- La înregistrare, parola trebuie: 8+ caractere, o majusculă, o cifră, un caracter special
- Contul email+parolă rămâne fără acces la `/dashboard` și `/onboarding` până la confirmarea adresei (`email_confirmed_at`)
- Mesaj generic la eșec: „Email sau parolă incorectă” (fără enumerarea utilizatorilor)
- Middleware care reîmprospătează sesiunea, blochează `/dashboard/*` pentru vizitatori, cere cookie Early Access pentru `/login` / `/register` / `/recuperare-parola` și trimite la `/onboarding` dacă lipsește `clinic_profiles`
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
- Protejat cu `Authorization: Bearer ${CRON_SECRET}` (`process.env.CRON_SECRET`). Fără secret, fără `Bearer` sau token greșit → `{ "error": "Neautorizat." }` (401).
- Rulează resetul dacă: cron-ul Vercel apelează ruta (`user-agent: vercel-cron/1.0` / `x-vercel-cron-schedule`), sau `?force=1`, sau e fereastra 00:00–01:00 Europe/Bucharest.

Trigger manual: `GET /api/cron/reset-daily-progress?force=1` cu `Authorization: Bearer ${CRON_SECRET}`. Alias-uri: `/api/cron/daily?task=program&force=1`, `/api/cron/daily-update`.

Reminder-ul de check-in de la 18:00 **nu** poate rula în același cron Hobby (ar trebui o a doua declanșare). Rămâne pe `/api/cron/reminders` (sau `?task=reminders` pe `/api/cron/daily`) pentru trigger manual, **cron-job.org** sau plan Pro. Endpoint-ul **nu e public**. În cron-job.org: Advanced → Request headers, Key `Authorization`, Value `Bearer ` + **exact** valoarea `CRON_SECRET` din Vercel (fără ghilimele). Acceptă și secretul brut sau `X-Cron-Secret`. Fără secret pe server, fără header sau valoare diferită → 401 `{ "ok": false, "error": "Neautorizat.", "reason": "missing_secret" | "missing_header" | "mismatch", "hint": "…" }`. Dacă 401-ul e HTML (nu JSON), e **Vercel Deployment Protection** — Bypass for Automation, nu rutele din app. Erorile de bază sau de pacient se întorc ca 500 JSON; un pacient eșuat nu oprește restul job-ului. `?force=1` ignoră fereastra 18:00.

Reminder-ele de check-in se trimit **doar automat** la 18:00 prin `/api/cron/reminders` (cron-job.org). Sunt notificări push FCM către tokenurile din `patient_push_tokens`. Fără token, pacientul e sărit (`Pacientul nu a activat notificările push.`). Dacă FCM eșuează, job-ul marchează eșecul și **nu** apelează Twilio / WhatsApp. Nu există buton de reminder manual în dashboard.

## Notificări push (Firebase Cloud Messaging)

1. Creează un proiect Firebase, activează **Cloud Messaging** și o aplicație Web.
2. În Firebase Console → Project settings → Cloud Messaging, generează un **Web Push certificate** și copiază **cheia publică** (nu pe cea privată) în `NEXT_PUBLIC_FIREBASE_VAPID_KEY`.
3. Pe Vercel (și în `.env.local`) pune cheile **cu prefix `NEXT_PUBLIC_`**: `API_KEY`, `AUTH_DOMAIN`, `PROJECT_ID`, `STORAGE_BUCKET`, `MESSAGING_SENDER_ID`, `APP_ID`, `VAPID_KEY`. Alias-uri: `NEXT_PUBLIC_FIREBASE_SENDER_ID`, `NEXT_PUBLIC_FIREBASE_MESSAGING_VAPID_KEY`. După ce le adaugi, **redesfășoară** aplicația (cheile publice se citesc la build). Pe server pune **doar** `FIREBASE_SERVICE_ACCOUNT`: tot JSON-ul descărcat din Firebase (Project settings → Service accounts), pe un rând. `JSON.parse` citește obiectul întreg și `private_key` vine cu newline-uri reale — nu mai folosi `FIREBASE_PRIVATE_KEY` / `FIREBASE_PROJECT_ID` / `FIREBASE_CLIENT_EMAIL`.
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

## Instalare PWA (Android / Windows / Mac)

Butonul **Instalează Aplicația KinetoFlow** este vizibil în header-ul programului pacientului pe desktop și mobil. La click:

- dacă browserul emite `beforeinstallprompt` (Chrome/Edge/Brave), se deschide fereastra nativă de instalare;
- altfel apare un modal cu pașii pentru **Chrome**, **Brave** și **Samsung Internet** (adaptați după browserul detectat).

În aplicația deja instalată (mod standalone) butonul se ascunde.

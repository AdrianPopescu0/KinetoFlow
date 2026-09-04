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
- `NEXT_PUBLIC_SITE_URL` — originea aplicației (pentru linkurile de recuperare a parolei)
- `CRON_SECRET` — secret pentru cron-ul zilnic de reminder check-in (`Authorization: Bearer …` pe `/api/cron/reminders`); pe Vercel, dacă e setat, header-ul e trimis automat
- Opțional: `TWILIO_*` sau `WHATSAPP_CLOUD_*` pentru trimiterea WhatsApp (altfel doar click-to-chat)

În dashboard-ul Supabase, **Authentication → Providers → Email** trebuie să fie activ. Pentru fluxul de onboarding imediat după înregistrare, dezactivează „Confirm email” (sau lasă-l activ — utilizatorul confirmă din email și apoi intră în cont).

Adaugă URL-urile de redirect pentru recuperarea parolei și invitațiile WhatsApp:

- `http://localhost:43123/auth/callback`
- `http://127.0.0.1:43123/auth/callback`
- domeniul de producție + `/auth/callback`
- domeniul de producție + `/auth/callback?next=/auth/set-password`

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

Tabele: `patients` (token UUID unic pentru `/patient/[token]`; **fără** coloana `clinic_id` — cabinetul e `therapist_id` + `clinic_profiles.clinic_name`), `exercises`, `check_ins`, `exercise_completions` (finalizări zilnice din portalul pacientului — rulează `016_exercise_completions.sql`). Biblioteca din aplicație (`/dashboard/exercises`) rămâne comună; `exercise_library` e catalog, fără date de pacient.

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
app/patient/[token]/page.tsx     # Programul public al pacientului
app/patient/page.tsx             # Recuperare token (webview fără parametri)
app/p/[patientToken]/page.tsx    # Alias vechi al programului pacientului
app/api/cron/reminders/route.ts  # Cron zilnic: reminder WhatsApp check-in (Bearer CRON_SECRET)
app/api/cron/daily-update/route.ts # Recalculează zilnic exercițiile active (Bearer CRON_SECRET)
vercel.json                      # Cron reminders + daily-update la 21:00 UTC (= 00:00 RO / EEST)
```

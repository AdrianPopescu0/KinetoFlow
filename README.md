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

În dashboard-ul Supabase, **Authentication → Providers → Email** trebuie să fie activ. Pentru fluxul de onboarding imediat după înregistrare, dezactivează „Confirm email” (sau lasă-l activ — utilizatorul confirmă din email și apoi intră în cont).

Adaugă URL-urile de redirect pentru recuperarea parolei:

- `http://localhost:43123/auth/callback`
- `http://127.0.0.1:43123/auth/callback`
- domeniul de producție + `/auth/callback`

3. Instalează dependențele și pornește serverul de dezvoltare:

```bash
npm install
npm run dev -- --port 43123 --hostname 127.0.0.1
```

Deschide [http://127.0.0.1:43123/login](http://127.0.0.1:43123/login) sau programul pacient [http://127.0.0.1:43123/p/demo](http://127.0.0.1:43123/p/demo).

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
| `/auth/callback` | Schimb PKCE pentru sesiune după email |
| `/acces` | Login pacient: telefon + cod 8 cifre (obligatoriu înainte de `/p/[token]`) |
| `/p/[patientToken]` | Programul pacientului — doar cu sesiune după `/acces` |

## Schema pacienți

În Supabase: **SQL Editor** → lipește și rulează `supabase/migrations/001_patients.sql`.

Tabele: `patients` (token UUID unic pentru `/p/[token]`), `exercises` (programul pacientului), `check_ins`. Izolare pe cabinet: `user_id = auth.uid()`. Rulează și `supabase/migrations/006_tenant_isolation.sql`. Biblioteca de exerciții din aplicație (`/dashboard/exercises`) rămâne comună; tabela `exercise_library` e doar catalog, fără date de pacient.

Fișa clinică: `/dashboard/patients/[id]`. Note clinice: rulează și `supabase/migrations/002_clinical_notes.sql`. Cod de acces 8 cifre: `003_access_code.sql`. Email-ul pacientului e opțional; telefonul e obligatoriu la pacienți noi.

Profil clinică (onboarding): rulează `supabase/migrations/004_clinic_profiles.sql` în SQL Editor. Coloane: `user_id` (= `auth.uid()`), `clinic_name`, `therapist_name`, `phone`. Fără rând în `clinic_profiles`, terapeutul e redirecționat la `/onboarding`.

Formularul de suport din footer: rulează `supabase/migrations/007_support_tickets.sql`. Tabela `support_tickets` (id, name, contact, message, created_at, status) primește inserări publice; citirea nu e permisă din aplicație. După salvare, serverul trimite o notificare prin [Resend](https://resend.com) către `SUPPORT_NOTIFY_EMAIL` (implicit `kinetic01flow@gmail.com`). Fără `RESEND_API_KEY`, tichetul se salvează oricum; utilizatorul vede confirmarea chiar dacă emailul eșuează.

Reguli de securitate aplicate:

- Validare pe server pentru email și parolă înainte de apelul Auth
- La înregistrare, parola trebuie: 8+ caractere, o majusculă, o cifră, un caracter special
- Mesaj generic la eșec: „Email sau parolă incorectă” (fără enumerarea utilizatorilor)
- Middleware care reîmprospătează sesiunea, blochează `/dashboard/*` pentru vizitatori și trimite la `/onboarding` dacă lipsește `clinic_profiles`
- Verificare `getUser()` (nu `getSession()`) pentru autorizare

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
app/p/[patientToken]/page.tsx    # Programul pacientului
```

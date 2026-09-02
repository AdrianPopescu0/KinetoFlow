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

În dashboard-ul Supabase, adaugă URL-urile de redirect:

- `http://localhost:43123/auth/callback`
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
| `/login` | Formular de autentificare |
| `/recuperare-parola` | Cerere de resetare a parolei |
| `/dashboard` | Zonă protejată (doar utilizatori autentificați) |
| `/dashboard/exercises` | Bibliotecă de exerciții (taxonomie clinică, mock catalog) |
| `/auth/callback` | Schimb PKCE pentru sesiune după email |
| `/acces` | Login pacient: telefon + cod 8 cifre (obligatoriu înainte de `/p/[token]`) |
| `/p/[patientToken]` | Programul pacientului — doar cu sesiune după `/acces` |

## Schema pacienți

În Supabase: **SQL Editor** → lipește și rulează `supabase/migrations/001_patients.sql`.

Tabele: `patients` (token UUID unic pentru `/p/[token]`), `exercises`, `check_ins`. RLS: terapeutul vede doar pacienții lui.

Fișa clinică: `/dashboard/patients/[id]`. Note clinice: rulează și `supabase/migrations/002_clinical_notes.sql`. Cod de acces 8 cifre: `003_access_code.sql`. Email-ul pacientului e opțional; telefonul e obligatoriu la pacienți noi.

Reguli de securitate aplicate:

- Validare pe server pentru email și parolă înainte de apelul Auth
- Mesaj generic la eșec: „Email sau parolă incorectă” (fără enumerarea utilizatorilor)
- Middleware care reîmprospătează sesiunea și blochează `/dashboard/*` pentru vizitatori
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

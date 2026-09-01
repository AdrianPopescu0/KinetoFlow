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
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — cheia publicabilă (`sb_publishable_…`, sigură în browser)
- `SUPABASE_SECRET_KEY` — cheia secretă (`sb_secret_…`), doar pe server, **fără** prefix `NEXT_PUBLIC_`
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
| `/auth/callback` | Schimb PKCE pentru sesiune după email |
| `/p/[patientToken]` | Programul pacientului (exerciții + check-in zilnic) |

Reguli de securitate aplicate:

- Validare pe server pentru email și parolă înainte de apelul Auth
- Mesaj generic la eșec: „Email sau parolă incorectă” (fără enumerarea utilizatorilor)
- Middleware care reîmprospătează sesiunea și blochează `/dashboard/*` pentru vizitatori
- Verificare `getUser()` (nu `getSession()`) pentru autorizare

## Structură relevantă

```
lib/supabase/client.ts   # createBrowserClient
lib/supabase/server.ts   # createServerClient + cookies
middleware.ts            # sesiune + protecție rute
app/login/actions.ts     # Server Action login()
app/login/page.tsx       # UI login
app/p/[patientToken]/page.tsx  # Programul pacientului
```

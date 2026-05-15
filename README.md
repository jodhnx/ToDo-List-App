# Focus — Moderne To-Do-App (Online-fähig)

React · Vite · Tailwind · Supabase · Framer Motion

## Schnellstart (lokal)

```bash
npm install
npm run dev
```

→ http://localhost:5173

---

## Online stellen (für mehrere Benutzer)

Damit sich **andere Nutzer registrieren** und von überall zugreifen können, brauchst du **Supabase + Hosting**.

### 1. Supabase

1. Projekt auf [supabase.com](https://supabase.com) erstellen
2. **SQL Editor** → `supabase/schema.sql` ausführen
3. Falls Tabelle schon existiert → zusätzlich `supabase/migration_v2.sql` (pinned + Realtime)
4. **Authentication → URL Configuration**:
   - **Site URL:** `https://deine-app.vercel.app`
   - **Redirect URLs:** `https://deine-app.vercel.app/**`, `http://localhost:5173/**`
5. Optional: E-Mail-Bestätigung für Entwicklung deaktivieren

### 2. Umgebungsvariablen

Lokal `.env`:

```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=dein-anon-key
```

### 3. Deploy (Vercel — empfohlen)

```bash
npm i -g vercel
vercel
```

Oder: Repo auf GitHub → [vercel.com/new](https://vercel.com/new) → Projekt importieren

**Environment Variables** im Vercel-Dashboard setzen:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Nach Deploy: dieselbe URL in Supabase unter Redirect URLs eintragen.

### Alternative: Netlify

```bash
npm run build
```

`dist`-Ordner hochladen oder Repo verbinden — `netlify.toml` ist bereits konfiguriert.

---

## Neue Features

| Feature | Beschreibung |
|--------|----------------|
| **Multi-User Online** | Supabase Auth + RLS — jeder sieht nur eigene Todos |
| **Realtime-Sync** | Änderungen erscheinen sofort auf anderen Geräten |
| **Dashboard** | Stats, Kategorie-Chart, Prioritäten, Überfällig/Heute |
| **Sidebar + Mobile-Nav** | Dashboard · Aufgaben · Einstellungen |
| **Anpinnen** | Wichtige Aufgaben oben fixieren |
| **Schnellfilter** | Heute, Woche, Überfällig, Angepinnt |
| **Sortierung** | Datum, Priorität, Titel, Neu |
| **Bulk-Aktionen** | Alle erledigen, Erledigte löschen |
| **Export** | JSON-Download |
| **Duplizieren** | Aufgabe kopieren |
| **Toasts** | Feedback bei Aktionen |
| **Profil** | Anzeigename, Passwort-Reset |
| **Offline-Cache** | localStorage-Fallback bei Verbindungsproblemen |

---

## Projektstruktur

```
src/
  components/   UI, Dashboard, Todos, Layout
  context/      Auth, Theme, Todos, Toast
  hooks/        useTodos
  lib/          supabase, localStorage, todoUtils
  pages/        Landing, Auth, Dashboard, Tasks, Settings
supabase/       schema.sql, migration_v2.sql
```

---

## Build

```bash
npm run build
npm run preview
```

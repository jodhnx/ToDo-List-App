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
3. Falls Tabelle schon existiert → `migration_v2.sql`, `migration_v3_due_time.sql`, **`migration_v4_families.sql`**, **`migration_v4_families_fix.sql`**, **`migration_v5_roles.sql`**, **`migration_v6_shopping_items.sql`**, **`migration_v7_group_shopping_items.sql`**
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
| **Familie & Gruppen** | Geteilte Aufgaben, Einladungen per @username, Realtime |
| **Benutzername** | Global eindeutig (a–z, 0–9, _) — bei Registrierung |
| **Gruppen-Dashboard** | Fortschritt %, Mitglieder, Aktivität, „Meine Aufgaben“ |

### Familien / Gruppen (Supabase)

1. `supabase/migration_v4_families.sql` im SQL Editor ausführen  
   Erstellt: `profiles`, `groups`, `group_members`, `group_invites`, `shared_tasks`, `task_comments`, `notifications` + RLS + Realtime
2. In der App: **Familie** → Gruppe erstellen → Mitglieder per **@benutzername** einladen
3. Geteilte Aufgaben: Kategorien (Einkauf, Putzen, …), Zuweisung, Kommentare, Benachrichtigungen
4. Gemeinsame Einkaufsliste: `supabase/migration_v7_group_shopping_items.sql` ausführen, dann in einer Gruppe den Tab **Einkauf** öffnen
4. **Profil** (`/app/profile`): Benutzername & Anzeigename (Pflicht nach Google-Login)

Ohne Supabase bleiben **persönliche Aufgaben** lokal nutzbar; Gruppen erfordern Cloud.

---

## Projektstruktur

```
src/
  components/   UI, Dashboard, Todos, Layout
  context/      Auth, Theme, Todos, Toast
  hooks/        useTodos
  lib/          supabase, localStorage, todoUtils
  pages/        Landing, Auth, Home, Tasks, Shopping, Family, Profile, Settings
  components/groups/  Shared tasks, invites, dashboard
supabase/       schema.sql, migration_v2–v7
```

---

## Build

```bash
npm run build
npm run preview
```

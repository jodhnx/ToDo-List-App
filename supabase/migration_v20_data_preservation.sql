-- Focus v20: Datensicherheit — ausschließlich additive Migration
-- =============================================================
-- WICHTIG:
-- - Kein DROP TABLE
-- - Kein TRUNCATE
-- - Keine Löschung von Benutzerdaten
-- - Sicher mehrfach ausführbar (idempotent)
-- - Bestehende Datensätze bleiben vollständig erhalten
-- - Neue Spalten erhalten sinnvolle Standardwerte
--
-- Im Supabase SQL Editor nach allen vorherigen Migrationen ausführen.

-- ========== PROFILES (Konten, Benutzernamen, Theme) ==========
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS app_theme TEXT DEFAULT 'modern-dark';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

UPDATE public.profiles SET app_theme = 'modern-dark' WHERE app_theme IS NULL;

-- ========== GROUPS (Familien, Beschreibung, Bild, Owner) ==========
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT 'home';
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS invite_code TEXT;
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

UPDATE public.groups
SET owner_id = created_by
WHERE owner_id IS NULL AND created_by IS NOT NULL;

-- ========== GROUP MEMBERS (Rollen) ==========
ALTER TABLE public.group_members ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'member';
ALTER TABLE public.group_members ADD COLUMN IF NOT EXISTS joined_at TIMESTAMPTZ DEFAULT now();

-- ========== TODOS (persönliche Aufgaben) ==========
ALTER TABLE public.todos ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';
ALTER TABLE public.todos ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'privat';
ALTER TABLE public.todos ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'mittel';
ALTER TABLE public.todos ADD COLUMN IF NOT EXISTS due_date DATE;
ALTER TABLE public.todos ADD COLUMN IF NOT EXISTS due_time TIME;
ALTER TABLE public.todos ADD COLUMN IF NOT EXISTS reminder_at TIMESTAMPTZ;
ALTER TABLE public.todos ADD COLUMN IF NOT EXISTS completed BOOLEAN DEFAULT false;
ALTER TABLE public.todos ADD COLUMN IF NOT EXISTS pinned BOOLEAN DEFAULT false;
ALTER TABLE public.todos ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.todos ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- ========== SHARED TASKS (Gruppenaufgaben) ==========
ALTER TABLE public.shared_tasks ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';
ALTER TABLE public.shared_tasks ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'allgemein';
ALTER TABLE public.shared_tasks ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'mittel';
ALTER TABLE public.shared_tasks ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'open';
ALTER TABLE public.shared_tasks ADD COLUMN IF NOT EXISTS due_date DATE;
ALTER TABLE public.shared_tasks ADD COLUMN IF NOT EXISTS notify_enabled BOOLEAN DEFAULT false;
ALTER TABLE public.shared_tasks ADD COLUMN IF NOT EXISTS reminder_at TIMESTAMPTZ;
ALTER TABLE public.shared_tasks ADD COLUMN IF NOT EXISTS reminder_repeat TEXT;
ALTER TABLE public.shared_tasks ADD COLUMN IF NOT EXISTS reminder_early BOOLEAN DEFAULT false;
ALTER TABLE public.shared_tasks ADD COLUMN IF NOT EXISTS reminder_sound BOOLEAN DEFAULT true;
ALTER TABLE public.shared_tasks ADD COLUMN IF NOT EXISTS completed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.shared_tasks ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE public.shared_tasks ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.shared_tasks ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- ========== TASK COMMENTS ==========
CREATE TABLE IF NOT EXISTS public.task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.shared_tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ========== SHOPPING (persönlich + Gruppe) ==========
ALTER TABLE public.shopping_items ADD COLUMN IF NOT EXISTS quantity TEXT DEFAULT '1';
ALTER TABLE public.shopping_items ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Sonstiges';
ALTER TABLE public.shopping_items ADD COLUMN IF NOT EXISTS note TEXT DEFAULT '';
ALTER TABLE public.shopping_items ADD COLUMN IF NOT EXISTS checked BOOLEAN DEFAULT false;
ALTER TABLE public.shopping_items ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.shopping_items ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE public.group_shopping_items ADD COLUMN IF NOT EXISTS quantity TEXT DEFAULT '1';
ALTER TABLE public.group_shopping_items ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Sonstiges';
ALTER TABLE public.group_shopping_items ADD COLUMN IF NOT EXISTS note TEXT DEFAULT '';
ALTER TABLE public.group_shopping_items ADD COLUMN IF NOT EXISTS checked BOOLEAN DEFAULT false;
ALTER TABLE public.group_shopping_items ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.group_shopping_items ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- ========== FAVORITEN (Migration ohne Überschreiben bestehender Einträge) ==========
CREATE TABLE IF NOT EXISTS public.favorite_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Sonstiges',
  default_quantity TEXT NOT NULL DEFAULT '1',
  use_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, product_name, category)
);

DO $$
BEGIN
  IF to_regclass('public.shopping_favorites') IS NOT NULL THEN
    INSERT INTO public.favorite_products (
      user_id, product_name, category, default_quantity, use_count, created_at, updated_at
    )
    SELECT
      user_id, name, category, default_quantity, use_count, created_at, updated_at
    FROM public.shopping_favorites
    ON CONFLICT (user_id, product_name, category) DO NOTHING;
  END IF;
END $$;

-- ========== NOTIFICATIONS & INVITES ==========
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS read BOOLEAN DEFAULT false;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS payload JSONB DEFAULT '{}';
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE public.group_invites ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE public.group_invites ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- ========== REALTIME (nur hinzufügen, nie entfernen) ==========
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'profiles', 'groups', 'group_members', 'group_invites',
    'shared_tasks', 'task_comments', 'todos', 'shopping_items',
    'group_shopping_items', 'favorite_products', 'notifications'
  ]
  LOOP
    BEGIN
      EXECUTE format(
        'ALTER PUBLICATION supabase_realtime ADD TABLE public.%I',
        tbl
      );
    EXCEPTION
      WHEN duplicate_object THEN NULL;
      WHEN undefined_object THEN NULL;
    END;
  END LOOP;
END $$;

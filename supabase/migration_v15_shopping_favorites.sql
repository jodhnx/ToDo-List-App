-- Focus v15: Persönliche Einkaufs-Favoriten pro Benutzer.
-- Im Supabase SQL Editor nach v14 ausführen.

CREATE TABLE IF NOT EXISTS public.shopping_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Sonstiges',
  default_quantity TEXT NOT NULL DEFAULT '1',
  use_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, name, category)
);

CREATE INDEX IF NOT EXISTS shopping_favorites_user_idx
ON public.shopping_favorites(user_id, category, name);

ALTER TABLE public.shopping_favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "shopping_favorites_select" ON public.shopping_favorites;
CREATE POLICY "shopping_favorites_select" ON public.shopping_favorites FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "shopping_favorites_insert" ON public.shopping_favorites;
CREATE POLICY "shopping_favorites_insert" ON public.shopping_favorites FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "shopping_favorites_update" ON public.shopping_favorites;
CREATE POLICY "shopping_favorites_update" ON public.shopping_favorites FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "shopping_favorites_delete" ON public.shopping_favorites;
CREATE POLICY "shopping_favorites_delete" ON public.shopping_favorites FOR DELETE
  USING (user_id = auth.uid());

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'shopping_favorites'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.shopping_favorites;
  END IF;
END $$;

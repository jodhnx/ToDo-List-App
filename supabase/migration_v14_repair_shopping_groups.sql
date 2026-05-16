-- Focus v14: Reparatur für Einkaufslisten, Gruppen-Einkauf, RLS und Realtime.
-- Im Supabase SQL Editor nach allen bisherigen Migrationen ausführen.

CREATE TABLE IF NOT EXISTS public.shopping_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  quantity TEXT NOT NULL DEFAULT '1',
  category TEXT NOT NULL DEFAULT 'Sonstiges',
  note TEXT NOT NULL DEFAULT '',
  checked BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.shopping_items
ADD COLUMN IF NOT EXISTS quantity TEXT NOT NULL DEFAULT '1',
ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'Sonstiges',
ADD COLUMN IF NOT EXISTS note TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS checked BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS shopping_items_user_idx ON public.shopping_items(user_id);
CREATE INDEX IF NOT EXISTS shopping_items_checked_idx ON public.shopping_items(user_id, checked);

ALTER TABLE public.shopping_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "shopping_items_select" ON public.shopping_items;
CREATE POLICY "shopping_items_select" ON public.shopping_items FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "shopping_items_insert" ON public.shopping_items;
CREATE POLICY "shopping_items_insert" ON public.shopping_items FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "shopping_items_update" ON public.shopping_items;
CREATE POLICY "shopping_items_update" ON public.shopping_items FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "shopping_items_delete" ON public.shopping_items;
CREATE POLICY "shopping_items_delete" ON public.shopping_items FOR DELETE
  USING (user_id = auth.uid());

DO $$
BEGIN
  IF to_regclass('public.groups') IS NOT NULL THEN
    IF to_regclass('public.group_members') IS NOT NULL THEN
      CREATE OR REPLACE FUNCTION public.is_group_member(gid UUID, uid UUID)
      RETURNS BOOLEAN AS $fn$
        SELECT EXISTS (
          SELECT 1 FROM public.group_members
          WHERE group_id = gid AND user_id = uid
        );
      $fn$ LANGUAGE sql STABLE SECURITY DEFINER;
    END IF;

    CREATE TABLE IF NOT EXISTS public.group_shopping_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
      created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      checked_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
      name TEXT NOT NULL,
      quantity TEXT NOT NULL DEFAULT '1',
      category TEXT NOT NULL DEFAULT 'Sonstiges',
      note TEXT NOT NULL DEFAULT '',
      checked BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    ALTER TABLE public.group_shopping_items
    ADD COLUMN IF NOT EXISTS checked_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS quantity TEXT NOT NULL DEFAULT '1',
    ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'Sonstiges',
    ADD COLUMN IF NOT EXISTS note TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS checked BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

    CREATE INDEX IF NOT EXISTS group_shopping_items_group_idx ON public.group_shopping_items(group_id);
    CREATE INDEX IF NOT EXISTS group_shopping_items_status_idx ON public.group_shopping_items(group_id, checked);

    ALTER TABLE public.group_shopping_items ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "group_shopping_select" ON public.group_shopping_items;
    CREATE POLICY "group_shopping_select" ON public.group_shopping_items FOR SELECT
      USING (public.is_group_member(group_id, auth.uid()));

    DROP POLICY IF EXISTS "group_shopping_insert" ON public.group_shopping_items;
    CREATE POLICY "group_shopping_insert" ON public.group_shopping_items FOR INSERT
      WITH CHECK (
        created_by = auth.uid()
        AND public.is_group_member(group_id, auth.uid())
      );

    DROP POLICY IF EXISTS "group_shopping_update" ON public.group_shopping_items;
    CREATE POLICY "group_shopping_update" ON public.group_shopping_items FOR UPDATE
      USING (public.is_group_member(group_id, auth.uid()))
      WITH CHECK (public.is_group_member(group_id, auth.uid()));

    DROP POLICY IF EXISTS "group_shopping_delete" ON public.group_shopping_items;
    CREATE POLICY "group_shopping_delete" ON public.group_shopping_items FOR DELETE
      USING (public.is_group_member(group_id, auth.uid()));
  END IF;
END $$;

WITH ranked AS (
  SELECT
    id,
    row_number() OVER (
      PARTITION BY user_id, lower(trim(name)), category
      ORDER BY created_at ASC
    ) AS rn
  FROM public.shopping_items
  WHERE checked = false
)
UPDATE public.shopping_items item
SET checked = true, updated_at = now()
FROM ranked
WHERE item.id = ranked.id AND ranked.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS shopping_items_open_unique_idx
ON public.shopping_items (user_id, lower(trim(name)), category)
WHERE checked = false;

DO $$
BEGIN
  IF to_regclass('public.group_shopping_items') IS NOT NULL THEN
    WITH ranked AS (
      SELECT
        id,
        row_number() OVER (
          PARTITION BY group_id, lower(trim(name)), category
          ORDER BY created_at ASC
        ) AS rn
      FROM public.group_shopping_items
      WHERE checked = false
    )
    UPDATE public.group_shopping_items item
    SET checked = true, updated_at = now()
    FROM ranked
    WHERE item.id = ranked.id AND ranked.rn > 1;

    CREATE UNIQUE INDEX IF NOT EXISTS group_shopping_items_open_unique_idx
    ON public.group_shopping_items (group_id, lower(trim(name)), category)
    WHERE checked = false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'shopping_items'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.shopping_items;
  END IF;

  IF to_regclass('public.group_shopping_items') IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'group_shopping_items'
    )
  THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.group_shopping_items;
  END IF;
END $$;

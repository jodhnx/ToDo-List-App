-- Focus v17: Favoriten-Produkte als favorite_products Tabelle.
-- Im Supabase SQL Editor nach v16 ausführen.

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

CREATE INDEX IF NOT EXISTS favorite_products_user_idx
ON public.favorite_products(user_id, category, product_name);

DO $$
BEGIN
  IF to_regclass('public.shopping_favorites') IS NOT NULL THEN
    INSERT INTO public.favorite_products (
      user_id,
      product_name,
      category,
      default_quantity,
      use_count,
      created_at,
      updated_at
    )
    SELECT
      user_id,
      name,
      category,
      default_quantity,
      use_count,
      created_at,
      updated_at
    FROM public.shopping_favorites
    ON CONFLICT (user_id, product_name, category)
    DO UPDATE SET
      default_quantity = EXCLUDED.default_quantity,
      use_count = GREATEST(public.favorite_products.use_count, EXCLUDED.use_count),
      updated_at = now();
  END IF;
END $$;

ALTER TABLE public.favorite_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "favorite_products_select" ON public.favorite_products;
CREATE POLICY "favorite_products_select" ON public.favorite_products FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "favorite_products_insert" ON public.favorite_products;
CREATE POLICY "favorite_products_insert" ON public.favorite_products FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "favorite_products_update" ON public.favorite_products;
CREATE POLICY "favorite_products_update" ON public.favorite_products FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "favorite_products_delete" ON public.favorite_products;
CREATE POLICY "favorite_products_delete" ON public.favorite_products FOR DELETE
  USING (user_id = auth.uid());

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'favorite_products'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.favorite_products;
  END IF;
END $$;

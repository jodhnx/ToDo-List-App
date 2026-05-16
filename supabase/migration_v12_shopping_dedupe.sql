-- Focus v12: Einkaufslisten vor doppelten offenen Einträgen schützen.
-- Im Supabase SQL Editor ausführen (nach v11).

WITH ranked AS (
  SELECT
    id,
    row_number() OVER (
      PARTITION BY user_id, lower(trim(name)), category, checked
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

WITH ranked AS (
  SELECT
    id,
    row_number() OVER (
      PARTITION BY group_id, lower(trim(name)), category, checked
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

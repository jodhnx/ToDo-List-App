-- Focus v21: Familien-, Gruppen- und Einkaufssystem — Performance & Indizes
-- ========================================================================
-- WICHTIG:
-- - Kein DROP TABLE
-- - Kein TRUNCATE
-- - Keine Löschung von Benutzerdaten
-- - Sicher mehrfach ausführbar (idempotent)

CREATE INDEX IF NOT EXISTS idx_shared_tasks_group_id ON public.shared_tasks(group_id);
CREATE INDEX IF NOT EXISTS idx_shared_tasks_group_status ON public.shared_tasks(group_id, status);
CREATE INDEX IF NOT EXISTS idx_group_shopping_items_group_id ON public.group_shopping_items(group_id);
CREATE INDEX IF NOT EXISTS idx_group_shopping_items_group_checked ON public.group_shopping_items(group_id, checked);
CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON public.task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_created_at ON public.task_comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON public.group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON public.group_members(user_id);

-- Einkaufs-Favoriten pro Benutzer (falls Tabelle existiert)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'shopping_favorites'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_shopping_favorites_user_id ON public.shopping_favorites(user_id);
  END IF;
END $$;

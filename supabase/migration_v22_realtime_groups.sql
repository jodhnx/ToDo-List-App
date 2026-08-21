-- Focus v22: Realtime für Familiengruppen vollständig aktivieren
-- =============================================================
-- Sicher, idempotent, keine Datenlöschung.
-- Im Supabase SQL Editor ausführen.

-- Realtime-Publication: Tabellen hinzufügen (falls noch nicht enthalten)
DO $$
BEGIN
  -- shared_tasks
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'shared_tasks'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.shared_tasks;
  END IF;

  -- group_shopping_items
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'group_shopping_items'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'group_shopping_items'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.group_shopping_items;
  END IF;

  -- task_comments
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'task_comments'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'task_comments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.task_comments;
  END IF;

  -- group_members
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'group_members'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.group_members;
  END IF;

  -- groups
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'groups'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.groups;
  END IF;

  -- group_invites
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'group_invites'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'group_invites'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.group_invites;
  END IF;

  -- notifications
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notifications'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;

  -- shopping_items (persönlich)
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'shopping_items'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'shopping_items'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.shopping_items;
  END IF;

  -- favorite_products
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'favorite_products'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'favorite_products'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.favorite_products;
  END IF;
END $$;

-- REPLICA IDENTITY FULL für saubere DELETE-Payloads (kein Datenverlust)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='shared_tasks') THEN
    EXECUTE 'ALTER TABLE public.shared_tasks REPLICA IDENTITY FULL';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='group_shopping_items') THEN
    EXECUTE 'ALTER TABLE public.group_shopping_items REPLICA IDENTITY FULL';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='task_comments') THEN
    EXECUTE 'ALTER TABLE public.task_comments REPLICA IDENTITY FULL';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='group_members') THEN
    EXECUTE 'ALTER TABLE public.group_members REPLICA IDENTITY FULL';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='groups') THEN
    EXECUTE 'ALTER TABLE public.groups REPLICA IDENTITY FULL';
  END IF;
END $$;

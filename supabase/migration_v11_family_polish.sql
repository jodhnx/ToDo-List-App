-- Focus v11: Familienprofil und bessere Aktivitätsdaten
-- Im Supabase SQL Editor ausführen (nach v10).

ALTER TABLE public.groups
ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS invite_code TEXT;

UPDATE public.groups
SET invite_code = upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))
WHERE invite_code IS NULL OR trim(invite_code) = '';

CREATE UNIQUE INDEX IF NOT EXISTS groups_invite_code_key ON public.groups (invite_code);

ALTER TABLE public.groups
ALTER COLUMN invite_code SET DEFAULT upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

ALTER TABLE public.shared_tasks
ADD COLUMN IF NOT EXISTS completed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

CREATE OR REPLACE FUNCTION public.update_family_group(
  p_group_id UUID,
  p_name TEXT,
  p_icon TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_avatar_url TEXT DEFAULT NULL
)
RETURNS public.groups
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor UUID := auth.uid();
  g public.groups;
BEGIN
  IF actor IS NULL THEN RAISE EXCEPTION 'Nicht angemeldet'; END IF;
  IF trim(p_name) = '' THEN RAISE EXCEPTION 'Gruppenname erforderlich'; END IF;
  IF NOT public.is_group_owner(p_group_id, actor) THEN
    RAISE EXCEPTION 'Nur der Oberadmin kann die Gruppe verwalten';
  END IF;

  UPDATE public.groups
  SET
    name = trim(p_name),
    icon = COALESCE(NULLIF(trim(COALESCE(p_icon, '')), ''), icon),
    description = COALESCE(p_description, description),
    avatar_url = COALESCE(p_avatar_url, avatar_url)
  WHERE id = p_group_id
  RETURNING * INTO g;

  IF g.id IS NULL THEN RAISE EXCEPTION 'Gruppe nicht gefunden'; END IF;
  RETURN g;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_family_group(UUID, TEXT, TEXT, TEXT, TEXT) TO authenticated;

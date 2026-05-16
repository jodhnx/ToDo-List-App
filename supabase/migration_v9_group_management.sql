-- Focus v9: Gruppenverwaltung durch Owner/Oberadmin + owner_id Migration
-- Im Supabase SQL Editor ausführen (nach v8).

-- Echte Owner-Spalte, korrekt mit auth.users verknüpft.
ALTER TABLE public.groups
ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Alte Gruppen migrieren:
-- 1) created_by bleibt Quelle der Wahrheit, wenn vorhanden
-- 2) sonst vorhandenes owner-Mitglied
-- 3) sonst erstes Gruppenmitglied als Fallback
UPDATE public.groups g
SET owner_id = COALESCE(
  g.owner_id,
  g.created_by,
  (
    SELECT gm.user_id
    FROM public.group_members gm
    WHERE gm.group_id = g.id AND gm.role = 'owner'
    ORDER BY gm.joined_at ASC
    LIMIT 1
  ),
  (
    SELECT gm.user_id
    FROM public.group_members gm
    WHERE gm.group_id = g.id
    ORDER BY gm.joined_at ASC
    LIMIT 1
  )
)
WHERE g.owner_id IS NULL;

-- Owner-Mitglied für Altgruppen sicherstellen.
INSERT INTO public.group_members (group_id, user_id, role)
SELECT g.id, g.owner_id, 'owner'
FROM public.groups g
WHERE g.owner_id IS NOT NULL
ON CONFLICT (group_id, user_id)
DO UPDATE SET role = 'owner';

-- Alte created_by-Spalte mit owner_id synchron halten, falls sie leer/abweichend ist.
UPDATE public.groups
SET created_by = owner_id
WHERE owner_id IS NOT NULL
  AND (created_by IS NULL OR created_by <> owner_id);

-- Owner-Prüfung basiert jetzt auf owner_id ODER owner-Rolle.
CREATE OR REPLACE FUNCTION public.is_group_owner(gid UUID, uid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.groups
    WHERE id = gid AND owner_id = uid
  )
  OR EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = gid AND user_id = uid AND role = 'owner'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Gruppe erstellen: owner_id + created_by korrekt setzen.
CREATE OR REPLACE FUNCTION public.create_family_group(p_name TEXT, p_icon TEXT DEFAULT 'home')
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid UUID := auth.uid();
  g public.groups;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Nicht angemeldet'; END IF;
  IF trim(p_name) = '' THEN RAISE EXCEPTION 'Name erforderlich'; END IF;

  INSERT INTO public.groups (name, icon, created_by, owner_id)
  VALUES (trim(p_name), COALESCE(NULLIF(trim(p_icon), ''), 'home'), uid, uid)
  RETURNING * INTO g;

  INSERT INTO public.group_members (group_id, user_id, role)
  VALUES (g.id, uid, 'owner')
  ON CONFLICT (group_id, user_id) DO UPDATE SET role = 'owner';

  RETURN to_jsonb(g);
END;
$$;

CREATE OR REPLACE FUNCTION public.update_family_group(
  p_group_id UUID,
  p_name TEXT,
  p_icon TEXT DEFAULT NULL
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
    icon = COALESCE(NULLIF(trim(COALESCE(p_icon, '')), ''), icon)
  WHERE id = p_group_id
  RETURNING * INTO g;

  IF g.id IS NULL THEN RAISE EXCEPTION 'Gruppe nicht gefunden'; END IF;
  RETURN g;
END;
$$;

-- Rückwärtskompatibler Name für bestehende App-Versionen.
CREATE OR REPLACE FUNCTION public.rename_family_group(p_group_id UUID, p_name TEXT)
RETURNS public.groups
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN public.update_family_group(p_group_id, p_name, NULL);
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_family_group(p_group_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor UUID := auth.uid();
BEGIN
  IF actor IS NULL THEN RAISE EXCEPTION 'Nicht angemeldet'; END IF;
  IF NOT public.is_group_owner(p_group_id, actor) THEN
    RAISE EXCEPTION 'Nur der Oberadmin kann die Gruppe löschen';
  END IF;

  DELETE FROM public.groups WHERE id = p_group_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.rename_family_group(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_family_group(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_family_group(UUID) TO authenticated;

-- Owner darf nicht entfernt werden; Admins dürfen nur normale Mitglieder entfernen.
CREATE OR REPLACE FUNCTION public.remove_group_member(p_group_id UUID, p_target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor_role TEXT;
  target_role TEXT;
  actor UUID := auth.uid();
  group_owner UUID;
BEGIN
  IF actor IS NULL THEN RAISE EXCEPTION 'Nicht angemeldet'; END IF;

  SELECT owner_id INTO group_owner FROM public.groups WHERE id = p_group_id;

  SELECT role INTO actor_role FROM public.group_members
  WHERE group_id = p_group_id AND user_id = actor;

  SELECT role INTO target_role FROM public.group_members
  WHERE group_id = p_group_id AND user_id = p_target_user_id;

  IF actor_role IS NULL THEN RAISE EXCEPTION 'Du bist kein Mitglied'; END IF;
  IF target_role IS NULL THEN RAISE EXCEPTION 'Benutzer ist nicht in der Gruppe'; END IF;
  IF p_target_user_id = actor THEN RAISE EXCEPTION 'Du kannst dich nicht selbst entfernen'; END IF;
  IF p_target_user_id = group_owner OR target_role = 'owner' THEN
    RAISE EXCEPTION 'Der Oberadmin kann nicht entfernt werden';
  END IF;

  IF actor_role = 'owner' THEN
    NULL;
  ELSIF actor_role = 'admin' AND target_role = 'member' THEN
    NULL;
  ELSE
    RAISE EXCEPTION 'Keine Berechtigung zum Entfernen';
  END IF;

  DELETE FROM public.group_members
  WHERE group_id = p_group_id AND user_id = p_target_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.remove_group_member(UUID, UUID) TO authenticated;

-- Rollenänderungen ebenfalls strikt an owner_id koppeln.
CREATE OR REPLACE FUNCTION public.set_group_member_role(
  p_group_id UUID,
  p_target_user_id UUID,
  p_new_role TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_role TEXT;
  actor UUID := auth.uid();
  group_owner UUID;
BEGIN
  IF actor IS NULL THEN RAISE EXCEPTION 'Nicht angemeldet'; END IF;
  IF p_new_role NOT IN ('admin', 'member') THEN
    RAISE EXCEPTION 'Ungültiger Rang';
  END IF;

  SELECT owner_id INTO group_owner FROM public.groups WHERE id = p_group_id;

  IF actor <> group_owner THEN
    RAISE EXCEPTION 'Nur der Oberadmin kann Adminrechte ändern';
  END IF;

  SELECT role INTO target_role FROM public.group_members
  WHERE group_id = p_group_id AND user_id = p_target_user_id;

  IF target_role IS NULL THEN RAISE EXCEPTION 'Benutzer ist nicht in der Gruppe'; END IF;
  IF p_target_user_id = actor THEN RAISE EXCEPTION 'Eigenen Rang kannst du nicht ändern'; END IF;
  IF p_target_user_id = group_owner OR target_role = 'owner' THEN
    RAISE EXCEPTION 'Rang des Oberadmins kann nicht geändert werden';
  END IF;

  UPDATE public.group_members
  SET role = p_new_role
  WHERE group_id = p_group_id AND user_id = p_target_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_group_member_role(UUID, UUID, TEXT) TO authenticated;

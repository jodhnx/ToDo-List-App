-- Focus v5: Rollen (Oberadmin/Admin/Mitglied), entfernen, Ränge, Einladung für alle
-- Im Supabase SQL Editor ausführen (nach v4 + fix)

-- ========== ROLLEN erweitern ==========
ALTER TABLE public.group_members DROP CONSTRAINT IF EXISTS group_members_role_check;
ALTER TABLE public.group_members ADD CONSTRAINT group_members_role_check
  CHECK (role IN ('owner', 'admin', 'member'));

-- Ersteller wird Oberadmin (owner)
UPDATE public.group_members gm
SET role = 'owner'
FROM public.groups g
WHERE gm.group_id = g.id
  AND gm.user_id = g.created_by
  AND gm.role IN ('admin', 'member');

-- ========== Hilfsfunktionen ==========
CREATE OR REPLACE FUNCTION public.is_group_owner(gid UUID, uid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = gid AND user_id = uid AND role = 'owner'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_group_admin(gid UUID, uid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = gid AND user_id = uid AND role IN ('owner', 'admin')
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ========== Gruppe erstellen: Ersteller = owner ==========
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

  INSERT INTO public.groups (name, icon, created_by)
  VALUES (trim(p_name), COALESCE(NULLIF(trim(p_icon), ''), 'home'), uid)
  RETURNING * INTO g;

  INSERT INTO public.group_members (group_id, user_id, role)
  VALUES (g.id, uid, 'owner');

  RETURN to_jsonb(g);
END;
$$;

-- ========== Mitglied entfernen ==========
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
BEGIN
  IF actor IS NULL THEN RAISE EXCEPTION 'Nicht angemeldet'; END IF;

  SELECT role INTO actor_role FROM public.group_members
  WHERE group_id = p_group_id AND user_id = actor;

  SELECT role INTO target_role FROM public.group_members
  WHERE group_id = p_group_id AND user_id = p_target_user_id;

  IF actor_role IS NULL THEN RAISE EXCEPTION 'Du bist kein Mitglied'; END IF;
  IF target_role IS NULL THEN RAISE EXCEPTION 'Benutzer ist nicht in der Gruppe'; END IF;
  IF p_target_user_id = actor THEN RAISE EXCEPTION 'Du kannst dich nicht selbst entfernen'; END IF;
  IF target_role = 'owner' THEN RAISE EXCEPTION 'Der Oberadmin kann nicht entfernt werden'; END IF;

  IF actor_role = 'owner' THEN
    NULL; -- darf Admin + Mitglied entfernen
  ELSIF actor_role = 'admin' AND target_role = 'member' THEN
    NULL; -- Admin darf nur Mitglieder entfernen
  ELSE
    RAISE EXCEPTION 'Keine Berechtigung zum Entfernen';
  END IF;

  DELETE FROM public.group_members
  WHERE group_id = p_group_id AND user_id = p_target_user_id;
END;
$$;

-- ========== Rang vergeben (nur Oberadmin) ==========
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
BEGIN
  IF actor IS NULL THEN RAISE EXCEPTION 'Nicht angemeldet'; END IF;
  IF p_new_role NOT IN ('admin', 'member') THEN
    RAISE EXCEPTION 'Ungültiger Rang (nur admin oder member)';
  END IF;
  IF NOT public.is_group_owner(p_group_id, actor) THEN
    RAISE EXCEPTION 'Nur der Oberadmin kann Ränge vergeben';
  END IF;

  SELECT role INTO target_role FROM public.group_members
  WHERE group_id = p_group_id AND user_id = p_target_user_id;

  IF target_role IS NULL THEN RAISE EXCEPTION 'Benutzer ist nicht in der Gruppe'; END IF;
  IF target_role = 'owner' THEN RAISE EXCEPTION 'Rang des Oberadmins kann nicht geändert werden'; END IF;
  IF p_target_user_id = actor THEN RAISE EXCEPTION 'Eigenen Rang kannst du nicht ändern'; END IF;

  UPDATE public.group_members
  SET role = p_new_role
  WHERE group_id = p_group_id AND user_id = p_target_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_family_group(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_group_member(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_group_member_role(UUID, UUID, TEXT) TO authenticated;

-- ========== Einladen: jedes Mitglied ==========
DROP POLICY IF EXISTS "invites_insert" ON public.group_invites;
CREATE POLICY "invites_insert" ON public.group_invites FOR INSERT
  WITH CHECK (
    inviter_id = auth.uid()
    AND public.is_group_member(group_id, auth.uid())
  );

-- group_members UPDATE für owner via RPC (kein direktes UPDATE nötig)
DROP POLICY IF EXISTS "group_members_update" ON public.group_members;
CREATE POLICY "group_members_update" ON public.group_members FOR UPDATE
  USING (public.is_group_owner(group_id, auth.uid()));

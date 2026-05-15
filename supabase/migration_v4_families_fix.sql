-- Fix: Familie/Gruppe erstellen (RLS + RPC)
-- Im Supabase SQL Editor ausführen, wenn Gruppen-Erstellung fehlschlägt

-- Gruppe lesen: Mitglied ODER Ersteller (wichtig direkt nach INSERT)
DROP POLICY IF EXISTS "groups_select_member" ON public.groups;
CREATE POLICY "groups_select_member" ON public.groups FOR SELECT
  USING (
    public.is_group_member(id, auth.uid())
    OR created_by = auth.uid()
  );

-- Mitgliedschaft lesen: eigene Zeilen immer sichtbar
DROP POLICY IF EXISTS "group_members_select" ON public.group_members;
CREATE POLICY "group_members_select" ON public.group_members FOR SELECT
  USING (
    user_id = auth.uid()
    OR public.is_group_member(group_id, auth.uid())
  );

-- Erstes Mitglied (Admin) anlegen: selbst ODER Gruppenersteller
DROP POLICY IF EXISTS "group_members_insert" ON public.group_members;
CREATE POLICY "group_members_insert" ON public.group_members FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    OR public.is_group_admin(group_id, auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.groups g
      WHERE g.id = group_id AND g.created_by = auth.uid()
    )
  );

-- Atomar: Gruppe + Admin-Mitglied (umgeht RLS-Probleme)
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
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Nicht angemeldet';
  END IF;
  IF trim(p_name) = '' THEN
    RAISE EXCEPTION 'Name erforderlich';
  END IF;

  INSERT INTO public.groups (name, icon, created_by)
  VALUES (trim(p_name), COALESCE(NULLIF(trim(p_icon), ''), 'home'), uid)
  RETURNING * INTO g;

  INSERT INTO public.group_members (group_id, user_id, role)
  VALUES (g.id, uid, 'admin');

  RETURN to_jsonb(g);
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_family_group(TEXT, TEXT) TO authenticated;

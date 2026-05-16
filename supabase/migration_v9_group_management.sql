-- Focus v9: Gruppenverwaltung durch Owner/Oberadmin
-- Im Supabase SQL Editor ausführen (nach v8).

CREATE OR REPLACE FUNCTION public.rename_family_group(p_group_id UUID, p_name TEXT)
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
    RAISE EXCEPTION 'Nur der Oberadmin kann die Gruppe umbenennen';
  END IF;

  UPDATE public.groups
  SET name = trim(p_name)
  WHERE id = p_group_id
  RETURNING * INTO g;

  IF g.id IS NULL THEN RAISE EXCEPTION 'Gruppe nicht gefunden'; END IF;
  RETURN g;
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
GRANT EXECUTE ON FUNCTION public.delete_family_group(UUID) TO authenticated;

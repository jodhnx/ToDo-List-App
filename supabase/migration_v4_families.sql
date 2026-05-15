-- Focus — Family / Shared Groups (Migration v4)
-- Im Supabase SQL Editor ausführen (nach schema.sql / v2 / v3)

-- ========== PROFILES ==========
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT profiles_username_format CHECK (username ~ '^[a-zA-Z0-9_]{3,24}$'),
  CONSTRAINT profiles_username_unique UNIQUE (username)
);

CREATE INDEX IF NOT EXISTS profiles_username_idx ON public.profiles (username);

-- ========== GROUPS ==========
CREATE TABLE IF NOT EXISTS public.groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  icon TEXT DEFAULT 'home',
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ========== GROUP MEMBERS ==========
CREATE TABLE IF NOT EXISTS public.group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (group_id, user_id)
);

CREATE INDEX IF NOT EXISTS group_members_group_idx ON public.group_members (group_id);
CREATE INDEX IF NOT EXISTS group_members_user_idx ON public.group_members (user_id);

-- ========== GROUP INVITES ==========
CREATE TABLE IF NOT EXISTS public.group_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  inviter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invitee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS group_invites_invitee_idx ON public.group_invites (invitee_id, status);

-- ========== SHARED TASKS ==========
CREATE TABLE IF NOT EXISTS public.shared_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assignee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  category TEXT NOT NULL DEFAULT 'other' CHECK (
    category IN ('shopping', 'cleaning', 'bills', 'family', 'school', 'other')
  ),
  priority TEXT NOT NULL DEFAULT 'mittel' CHECK (priority IN ('niedrig', 'mittel', 'hoch')),
  due_date DATE,
  due_time TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS shared_tasks_group_idx ON public.shared_tasks (group_id);

-- ========== TASK COMMENTS ==========
CREATE TABLE IF NOT EXISTS public.task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.shared_tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS task_comments_task_idx ON public.task_comments (task_id);

-- ========== NOTIFICATIONS ==========
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (
    type IN ('invite', 'invite_accepted', 'task_assigned', 'task_completed', 'comment')
  ),
  title TEXT NOT NULL,
  body TEXT DEFAULT '',
  payload JSONB DEFAULT '{}',
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_user_idx ON public.notifications (user_id, read, created_at DESC);

-- ========== TRIGGERS ==========
CREATE OR REPLACE FUNCTION public.shared_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS shared_tasks_updated_at ON public.shared_tasks;
CREATE TRIGGER shared_tasks_updated_at
  BEFORE UPDATE ON public.shared_tasks
  FOR EACH ROW EXECUTE FUNCTION public.shared_tasks_updated_at();

-- ========== HELPER: group membership ==========
CREATE OR REPLACE FUNCTION public.is_group_member(gid UUID, uid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = gid AND user_id = uid
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_group_admin(gid UUID, uid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = gid AND user_id = uid AND role = 'admin'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ========== RLS ==========
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Profiles
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Groups: members see their groups
DROP POLICY IF EXISTS "groups_select_member" ON public.groups;
CREATE POLICY "groups_select_member" ON public.groups FOR SELECT
  USING (public.is_group_member(id, auth.uid()));

DROP POLICY IF EXISTS "groups_insert" ON public.groups;
CREATE POLICY "groups_insert" ON public.groups FOR INSERT
  WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "groups_update_admin" ON public.groups;
CREATE POLICY "groups_update_admin" ON public.groups FOR UPDATE
  USING (public.is_group_admin(id, auth.uid()));

-- Group members
DROP POLICY IF EXISTS "group_members_select" ON public.group_members;
CREATE POLICY "group_members_select" ON public.group_members FOR SELECT
  USING (public.is_group_member(group_id, auth.uid()));

DROP POLICY IF EXISTS "group_members_insert" ON public.group_members;
CREATE POLICY "group_members_insert" ON public.group_members FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    OR public.is_group_admin(group_id, auth.uid())
  );

DROP POLICY IF EXISTS "group_members_delete" ON public.group_members;
CREATE POLICY "group_members_delete" ON public.group_members FOR DELETE
  USING (
    auth.uid() = user_id
    OR public.is_group_admin(group_id, auth.uid())
  );

-- Invites
DROP POLICY IF EXISTS "invites_select" ON public.group_invites;
CREATE POLICY "invites_select" ON public.group_invites FOR SELECT
  USING (
    invitee_id = auth.uid()
    OR inviter_id = auth.uid()
    OR public.is_group_admin(group_id, auth.uid())
  );

DROP POLICY IF EXISTS "invites_insert" ON public.group_invites;
CREATE POLICY "invites_insert" ON public.group_invites FOR INSERT
  WITH CHECK (
    inviter_id = auth.uid()
    AND public.is_group_admin(group_id, auth.uid())
  );

DROP POLICY IF EXISTS "invites_update_invitee" ON public.group_invites;
CREATE POLICY "invites_update_invitee" ON public.group_invites FOR UPDATE
  USING (invitee_id = auth.uid());

-- Shared tasks
DROP POLICY IF EXISTS "shared_tasks_select" ON public.shared_tasks;
CREATE POLICY "shared_tasks_select" ON public.shared_tasks FOR SELECT
  USING (public.is_group_member(group_id, auth.uid()));

DROP POLICY IF EXISTS "shared_tasks_insert" ON public.shared_tasks;
CREATE POLICY "shared_tasks_insert" ON public.shared_tasks FOR INSERT
  WITH CHECK (
    creator_id = auth.uid()
    AND public.is_group_member(group_id, auth.uid())
  );

DROP POLICY IF EXISTS "shared_tasks_update" ON public.shared_tasks;
CREATE POLICY "shared_tasks_update" ON public.shared_tasks FOR UPDATE
  USING (public.is_group_member(group_id, auth.uid()));

DROP POLICY IF EXISTS "shared_tasks_delete" ON public.shared_tasks;
CREATE POLICY "shared_tasks_delete" ON public.shared_tasks FOR DELETE
  USING (
    creator_id = auth.uid()
    OR public.is_group_admin(group_id, auth.uid())
  );

-- Comments
DROP POLICY IF EXISTS "comments_select" ON public.task_comments;
CREATE POLICY "comments_select" ON public.task_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.shared_tasks t
      WHERE t.id = task_id AND public.is_group_member(t.group_id, auth.uid())
    )
  );

DROP POLICY IF EXISTS "comments_insert" ON public.task_comments;
CREATE POLICY "comments_insert" ON public.task_comments FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.shared_tasks t
      WHERE t.id = task_id AND public.is_group_member(t.group_id, auth.uid())
    )
  );

-- Notifications
DROP POLICY IF EXISTS "notifications_select" ON public.notifications;
CREATE POLICY "notifications_select" ON public.notifications FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "notifications_update" ON public.notifications;
CREATE POLICY "notifications_update" ON public.notifications FOR UPDATE
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "notifications_insert" ON public.notifications;
CREATE POLICY "notifications_insert" ON public.notifications FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Service role / triggers insert notifications via RPC from client

-- ========== REALTIME ==========
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_invites;
ALTER PUBLICATION supabase_realtime ADD TABLE public.shared_tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.task_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

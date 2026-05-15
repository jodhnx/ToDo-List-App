import { supabase, isSupabaseConfigured } from './supabase'
import { fetchProfileByUsername } from './profiles'

export function groupsEnabled() {
  return isSupabaseConfigured && !!supabase
}

async function createNotification({ user_id, type, title, body, payload = {} }) {
  if (!supabase) return
  await supabase.from('notifications').insert({
    user_id,
    type,
    title,
    body,
    payload,
  })
}

/** Gruppe erstellen + Admin-Mitglied */
export async function createGroup({ name, icon, userId }) {
  const { data: group, error: gErr } = await supabase
    .from('groups')
    .insert({ name: name.trim(), icon: icon || 'home', created_by: userId })
    .select()
    .single()
  if (gErr) throw gErr

  const { error: mErr } = await supabase.from('group_members').insert({
    group_id: group.id,
    user_id: userId,
    role: 'admin',
  })
  if (mErr) throw mErr
  return group
}

export async function fetchMyGroups(userId) {
  const { data: memberships, error: mErr } = await supabase
    .from('group_members')
    .select('role, joined_at, groups(id, name, icon, created_by, created_at)')
    .eq('user_id', userId)
  if (mErr) throw mErr

  return (memberships || [])
    .filter((m) => m.groups)
    .map((m) => ({ ...m.groups, my_role: m.role, joined_at: m.joined_at }))
}

export async function fetchGroupMembers(groupId) {
  const { data, error } = await supabase
    .from('group_members')
    .select('id, role, joined_at, user_id')
    .eq('group_id', groupId)
  if (error) throw error
  const members = data || []
  const ids = members.map((m) => m.user_id)
  if (!ids.length) return []

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url')
    .in('id', ids)

  const map = Object.fromEntries((profiles || []).map((p) => [p.id, p]))
  return members.map((m) => ({ ...m, profile: map[m.user_id] }))
}

export async function inviteByUsername({ groupId, inviterId, username, groupName }) {
  const profile = await fetchProfileByUsername(username)
  if (!profile) throw new Error('Benutzer nicht gefunden')
  if (profile.id === inviterId) throw new Error('Du kannst dich nicht selbst einladen')

  const { data: existing } = await supabase
    .from('group_members')
    .select('id')
    .eq('group_id', groupId)
    .eq('user_id', profile.id)
    .maybeSingle()
  if (existing) throw new Error('Ist bereits Mitglied')

  const { data: invite, error } = await supabase
    .from('group_invites')
    .insert({
      group_id: groupId,
      inviter_id: inviterId,
      invitee_id: profile.id,
      status: 'pending',
    })
    .select()
    .single()
  if (error) {
    if (error.code === '23505') throw new Error('Einladung bereits gesendet')
    throw error
  }

  await createNotification({
    user_id: profile.id,
    type: 'invite',
    title: 'Gruppeneinladung',
    body: `Du wurdest zu „${groupName}“ eingeladen`,
    payload: { invite_id: invite.id, group_id: groupId },
  })

  return invite
}

export async function fetchPendingInvites(userId) {
  const { data, error } = await supabase
    .from('group_invites')
    .select('*, groups(id, name, icon)')
    .eq('invitee_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function respondToInvite({ inviteId, userId, accept, groupName, inviterId }) {
  const status = accept ? 'accepted' : 'declined'
  const { data: invite, error } = await supabase
    .from('group_invites')
    .update({ status })
    .eq('id', inviteId)
    .eq('invitee_id', userId)
    .select('*, group_id')
    .single()
  if (error) throw error

  if (accept) {
    await supabase.from('group_members').insert({
      group_id: invite.group_id,
      user_id: userId,
      role: 'member',
    })
    if (inviterId) {
      await createNotification({
        user_id: inviterId,
        type: 'invite_accepted',
        title: 'Einladung angenommen',
        body: `Jemand ist „${groupName}“ beigetreten`,
        payload: { group_id: invite.group_id },
      })
    }
  }
  return invite
}

export async function fetchSharedTasks(groupId) {
  const { data, error } = await supabase
    .from('shared_tasks')
    .select('*')
    .eq('group_id', groupId)
    .order('created_at', { ascending: false })
  if (error) throw error

  const tasks = data || []
  const ids = [...new Set(tasks.flatMap((t) => [t.creator_id, t.assignee_id].filter(Boolean)))]
  if (!ids.length) return tasks

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url')
    .in('id', ids)

  const map = Object.fromEntries((profiles || []).map((p) => [p.id, p]))
  return tasks.map((t) => ({
    ...t,
    creator: map[t.creator_id],
    assignee: t.assignee_id ? map[t.assignee_id] : null,
  }))
}

export async function createSharedTask(payload) {
  const { data, error } = await supabase.from('shared_tasks').insert(payload).select().single()
  if (error) throw error

  if (payload.assignee_id && payload.assignee_id !== payload.creator_id) {
    await createNotification({
      user_id: payload.assignee_id,
      type: 'task_assigned',
      title: 'Aufgabe zugewiesen',
      body: payload.title,
      payload: { task_id: data.id, group_id: payload.group_id },
    })
  }
  return data
}

export async function updateSharedTask(id, updates, meta = {}) {
  const { data, error } = await supabase.from('shared_tasks').update(updates).eq('id', id).select().single()
  if (error) throw error

  if (updates.status === 'completed' && meta.notifyUserId) {
    await createNotification({
      user_id: meta.notifyUserId,
      type: 'task_completed',
      title: 'Aufgabe erledigt',
      body: data.title,
      payload: { task_id: id, group_id: data.group_id },
    })
  }

  if (updates.assignee_id && updates.assignee_id !== meta.actorId) {
    await createNotification({
      user_id: updates.assignee_id,
      type: 'task_assigned',
      title: 'Aufgabe zugewiesen',
      body: data.title,
      payload: { task_id: id, group_id: data.group_id },
    })
  }

  return data
}

export async function deleteSharedTask(id) {
  const { error } = await supabase.from('shared_tasks').delete().eq('id', id)
  if (error) throw error
}

export async function fetchTaskComments(taskId) {
  const { data, error } = await supabase
    .from('task_comments')
    .select('*, profiles(id, username, display_name, avatar_url)')
    .eq('task_id', taskId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data || []
}

export async function addTaskComment({ taskId, userId, body, notifyUserId, taskTitle }) {
  const { data, error } = await supabase
    .from('task_comments')
    .insert({ task_id: taskId, user_id: userId, body: body.trim() })
    .select('*, profiles(id, username, display_name)')
    .single()
  if (error) throw error

  if (notifyUserId && notifyUserId !== userId) {
    await createNotification({
      user_id: notifyUserId,
      type: 'comment',
      title: 'Neuer Kommentar',
      body: taskTitle,
      payload: { task_id: taskId },
    })
  }
  return data
}

export async function fetchNotifications(userId) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) throw error
  return data || []
}

export async function markNotificationRead(id) {
  await supabase.from('notifications').update({ read: true }).eq('id', id)
}

export async function markAllNotificationsRead(userId) {
  await supabase.from('notifications').update({ read: true }).eq('user_id', userId).eq('read', false)
}

export async function fetchGroupActivity(groupId, limit = 20) {
  const { data: tasks, error } = await supabase
    .from('shared_tasks')
    .select('id, title, status, created_at, updated_at, creator_id')
    .eq('group_id', groupId)
    .order('updated_at', { ascending: false })
    .limit(limit)

  if (error) throw error

  const creatorIds = [...new Set((tasks || []).map((t) => t.creator_id))]
  let profileMap = {}
  if (creatorIds.length) {
    const { data: profiles } = await supabase.from('profiles').select('id, username, display_name').in('id', creatorIds)
    profileMap = Object.fromEntries((profiles || []).map((p) => [p.id, p]))
  }

  return (tasks || []).map((t) => {
    const p = profileMap[t.creator_id]
    return {
      id: `task-${t.id}`,
      type: t.status === 'completed' ? 'task_completed' : 'task_created',
      at: t.updated_at || t.created_at,
      text: t.title,
      user: p?.display_name || p?.username || 'Mitglied',
    }
  })
}

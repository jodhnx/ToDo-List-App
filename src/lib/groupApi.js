import { supabase, isSupabaseConfigured } from './supabase'
import { fetchProfileByUsername } from './profiles'
import { formatGroupError } from './groupErrors'

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

/** Prüfen ob Familien-Tabellen existieren */
export async function checkGroupsSchema() {
  if (!supabase) return { ok: false, reason: 'no_supabase' }
  const { error } = await supabase.from('groups').select('id').limit(1)
  if (error) {
    if (error.code === '42P01' || /does not exist/i.test(error.message)) {
      return { ok: false, reason: 'missing_tables' }
    }
    return { ok: false, reason: 'error', message: formatGroupError(error) }
  }
  return { ok: true }
}

/** Gruppe erstellen + Admin-Mitglied (RPC, Fallback direkt) */
export async function createGroup({ name, icon, userId }) {
  if (!supabase) throw new Error('Supabase nicht verbunden')
  if (!userId) throw new Error('Nicht angemeldet')

  const trimmed = name.trim()
  const iconVal = icon || 'home'

  // Bevorzugt: sichere RPC (migration_v4_families_fix.sql)
  const { data: rpcData, error: rpcErr } = await supabase.rpc('create_family_group', {
    p_name: trimmed,
    p_icon: iconVal,
  })

  if (!rpcErr && rpcData) {
    return typeof rpcData === 'object' && rpcData.id ? rpcData : rpcData
  }

  const rpcMissing = rpcErr && /function|42883|PGRST202/i.test(rpcErr.message || '')

  if (rpcErr && !rpcMissing) {
    throw new Error(formatGroupError(rpcErr))
  }

  // Fallback: direkter Insert (mit gefixten RLS-Policies)
  const { data: group, error: gErr } = await supabase
    .from('groups')
    .insert({ name: trimmed, icon: iconVal, created_by: userId })
    .select('*')
    .single()

  if (gErr) throw new Error(formatGroupError(gErr))

  const { error: mErr } = await supabase.from('group_members').insert({
    group_id: group.id,
    user_id: userId,
    role: 'owner',
  })

  if (mErr) {
    await supabase.from('groups').delete().eq('id', group.id)
    throw new Error(formatGroupError(mErr))
  }

  return group
}

export async function fetchMyGroups(userId) {
  const { data: memberships, error: mErr } = await supabase
    .from('group_members')
    .select('group_id, role, joined_at')
    .eq('user_id', userId)

  if (mErr) throw new Error(formatGroupError(mErr))
  if (!memberships?.length) return []

  const groupIds = memberships.map((m) => m.group_id)
  const { data: groups, error: gErr } = await supabase
    .from('groups')
    .select('*')
    .in('id', groupIds)

  if (gErr) throw new Error(formatGroupError(gErr))

  const { data: memberRows, error: cErr } = await supabase
    .from('group_members')
    .select('group_id')
    .in('group_id', groupIds)

  if (cErr) throw new Error(formatGroupError(cErr))

  const memberCounts = {}
  for (const row of memberRows || []) {
    memberCounts[row.group_id] = (memberCounts[row.group_id] || 0) + 1
  }

  const ownerIds = [...new Set((groups || []).map((g) => g.owner_id || g.created_by).filter(Boolean))]
  let ownerProfiles = {}
  if (ownerIds.length) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url')
      .in('id', ownerIds)
    ownerProfiles = Object.fromEntries((profiles || []).map((p) => [p.id, p]))
  }

  const meta = Object.fromEntries(memberships.map((m) => [m.group_id, m]))
  const groupMap = Object.fromEntries((groups || []).map((g) => [g.id, g]))

  return memberships.map((m) => {
    const g = groupMap[m.group_id]
    if (g) {
      return {
        ...g,
        owner_id: g.owner_id || g.created_by,
        my_role: meta[m.group_id]?.role,
        joined_at: meta[m.group_id]?.joined_at,
        member_count: memberCounts[g.id] || 0,
        owner: ownerProfiles[g.owner_id || g.created_by] || null,
      }
    }
    return {
      id: m.group_id,
      name: 'Familiengruppe',
      icon: 'home',
      my_role: meta[m.group_id]?.role,
      joined_at: meta[m.group_id]?.joined_at,
      member_count: memberCounts[m.group_id] || 0,
      owner: null,
    }
  })
}

export async function fetchGroupMembers(groupId) {
  const { data, error } = await supabase
    .from('group_members')
    .select('id, role, joined_at, user_id')
    .eq('group_id', groupId)
  if (error) throw new Error(formatGroupError(error))
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
  if (error) throw new Error(formatGroupError(error))
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
  if (error) {
    console.error('Gruppenaufgabe konnte nicht in Supabase gespeichert werden:', error)
    throw new Error(formatGroupError(error))
  }

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
  if (error) {
    console.error('Gruppenaufgabe konnte nicht in Supabase aktualisiert werden:', error)
    throw new Error(formatGroupError(error))
  }

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
  let { data, error } = await supabase.from('shared_tasks').insert(payload).select().single()
  if (error && /notify_enabled|reminder_at|reminder_repeat|reminder_early|reminder_sound|column/i.test(error.message || '')) {
    const {
      notify_enabled,
      reminder_at,
      reminder_repeat,
      reminder_early,
      reminder_sound,
      ...fallbackPayload
    } = payload
    const retry = await supabase.from('shared_tasks').insert(fallbackPayload).select().single()
    data = retry.data
    error = retry.error
  }
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
  let { data, error } = await supabase.from('shared_tasks').update(updates).eq('id', id).select().single()
  if (error && /completed_by|completed_at|column/i.test(error.message || '')) {
    const { completed_by, completed_at, ...fallbackUpdates } = updates
    const retry = await supabase.from('shared_tasks').update(fallbackUpdates).eq('id', id).select().single()
    data = retry.data
    error = retry.error
  }
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
  if (error) {
    console.error('Gruppenaufgabe konnte nicht in Supabase gelöscht werden:', error)
    throw new Error(formatGroupError(error))
  }
}

export async function fetchGroupShoppingItems(groupId) {
  const { data, error } = await supabase
    .from('group_shopping_items')
    .select('*')
    .eq('group_id', groupId)
    .order('created_at', { ascending: false })

  if (error) throw error

  const items = data || []
  const ids = [...new Set(items.flatMap((item) => [item.created_by, item.checked_by].filter(Boolean)))]
  if (!ids.length) return items

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url')
    .in('id', ids)

  const map = Object.fromEntries((profiles || []).map((p) => [p.id, p]))
  return items.map((item) => ({
    ...item,
    creator: map[item.created_by],
    checkedBy: item.checked_by ? map[item.checked_by] : null,
  }))
}

export async function createGroupShoppingItem(payload) {
  const row = {
    ...payload,
    name: payload.name.trim(),
    quantity: payload.quantity?.trim() || '1',
    category: payload.category || 'Sonstiges',
    note: payload.note?.trim() || '',
    checked: false,
  }

  const { data, error } = await supabase.from('group_shopping_items').insert(row).select().single()
  if (error?.code === '23505') throw new Error('Dieses Produkt steht schon auf der Familienliste')
  if (error) throw new Error(formatGroupError(error))
  return data
}

export async function updateGroupShoppingItem(id, updates) {
  const { data, error } = await supabase
    .from('group_shopping_items')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw new Error(formatGroupError(error))
  return data
}

export async function deleteGroupShoppingItem(id) {
  const { error } = await supabase.from('group_shopping_items').delete().eq('id', id)
  if (error) throw new Error(formatGroupError(error))
}

export async function fetchTaskComments(taskId) {
  const { data, error } = await supabase
    .from('task_comments')
    .select('id, task_id, user_id, body, created_at')
    .eq('task_id', taskId)
    .order('created_at', { ascending: true })
  if (error) throw new Error(formatGroupError(error))

  const comments = data || []
  const userIds = [...new Set(comments.map((c) => c.user_id).filter(Boolean))]
  if (!userIds.length) return comments

  const { data: profiles, error: pErr } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url')
    .in('id', userIds)
  if (pErr) throw new Error(formatGroupError(pErr))

  const profileMap = Object.fromEntries((profiles || []).map((profile) => [profile.id, profile]))
  return comments.map((comment) => ({ ...comment, profile: profileMap[comment.user_id] || null }))
}

export async function addTaskComment({ taskId, userId, body, notifyUserId, taskTitle }) {
  const cleanBody = String(body || '').trim()
  if (!cleanBody) throw new Error('Bitte zuerst einen Kommentar schreiben')

  const { data, error } = await supabase
    .from('task_comments')
    .insert({ task_id: taskId, user_id: userId, body: cleanBody })
    .select('id, task_id, user_id, body, created_at')
    .single()
  if (error) throw new Error(formatGroupError(error))

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url')
    .eq('id', userId)
    .maybeSingle()

  if (notifyUserId && notifyUserId !== userId) {
    await createNotification({
      user_id: notifyUserId,
      type: 'comment',
      title: 'Neuer Kommentar',
      body: taskTitle,
      payload: { task_id: taskId },
    })
  }
  return { ...data, profile: profile || null }
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

/** Mitglied aus Gruppe entfernen */
export async function removeGroupMember(groupId, targetUserId) {
  const { error } = await supabase.rpc('remove_group_member', {
    p_group_id: groupId,
    p_target_user_id: targetUserId,
  })
  if (error) throw new Error(formatGroupError(error))
}

/** Rang vergeben (owner → admin/member) */
export async function setGroupMemberRole(groupId, targetUserId, newRole) {
  const { error } = await supabase.rpc('set_group_member_role', {
    p_group_id: groupId,
    p_target_user_id: targetUserId,
    p_new_role: newRole,
  })
  if (error) throw new Error(formatGroupError(error))
}

/** Gruppe verwalten (nur Owner/Oberadmin via RPC) */
export async function updateGroup(groupId, { name, icon, description, avatar_url }) {
  const trimmed = String(name || '').trim()
  if (!trimmed) throw new Error('Gruppenname erforderlich')

  let { data, error } = await supabase.rpc('update_family_group', {
    p_group_id: groupId,
    p_name: trimmed,
    p_icon: icon || null,
    p_description: description ?? null,
    p_avatar_url: avatar_url ?? null,
  })
  if (error && /function|p_description|p_avatar_url/i.test(error.message || '')) {
    const retry = await supabase.rpc('update_family_group', {
      p_group_id: groupId,
      p_name: trimmed,
      p_icon: icon || null,
    })
    data = retry.data
    error = retry.error
  }
  if (error) throw new Error(formatGroupError(error))
  return data
}

export const renameGroup = (groupId, name) => updateGroup(groupId, { name })

/** Gruppe löschen (nur Owner/Oberadmin via RPC) */
export async function deleteGroup(groupId) {
  const { error } = await supabase.rpc('delete_family_group', {
    p_group_id: groupId,
  })
  if (error) throw new Error(formatGroupError(error))
}

/** Mitglied per @username für Aufgabe finden */
export function resolveMemberByUsername(members, username) {
  const q = String(username || '').trim().replace(/^@/, '').toLowerCase()
  if (!q) return null
  return members.find((m) => m.profile?.username?.toLowerCase() === q) || null
}

export async function fetchGroupAllComments(groupId) {
  const { data: tasks, error: tErr } = await supabase
    .from('shared_tasks')
    .select('id, title')
    .eq('group_id', groupId)
  if (tErr) throw new Error(formatGroupError(tErr))
  if (!tasks?.length) return []

  const taskMap = Object.fromEntries(tasks.map((t) => [t.id, t.title]))
  const taskIds = tasks.map((t) => t.id)

  const { data: comments, error: cErr } = await supabase
    .from('task_comments')
    .select('id, task_id, user_id, body, created_at')
    .in('task_id', taskIds)
    .order('created_at', { ascending: false })
    .limit(100)
  if (cErr) throw new Error(formatGroupError(cErr))

  const userIds = [...new Set((comments || []).map((c) => c.user_id).filter(Boolean))]
  let profileMap = {}
  if (userIds.length) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url')
      .in('id', userIds)
    profileMap = Object.fromEntries((profiles || []).map((p) => [p.id, p]))
  }

  return (comments || []).map((c) => ({
    ...c,
    taskTitle: taskMap[c.task_id] || 'Aufgabe',
    profile: profileMap[c.user_id] || null,
  }))
}

export async function fetchGroupActivity(groupId, limit = 30) {
  let tasksRes = await supabase
    .from('shared_tasks')
    .select('id, title, status, created_at, updated_at, creator_id, completed_by, completed_at')
    .eq('group_id', groupId)
    .order('updated_at', { ascending: false })
    .limit(50)

  if (tasksRes.error && /completed_by|completed_at|column/i.test(tasksRes.error.message || '')) {
    tasksRes = await supabase
      .from('shared_tasks')
      .select('id, title, status, created_at, updated_at, creator_id')
      .eq('group_id', groupId)
      .order('updated_at', { ascending: false })
      .limit(50)
  }

  const shoppingRes = await supabase
    .from('group_shopping_items')
    .select('id, name, checked, created_at, updated_at, created_by, checked_by')
    .eq('group_id', groupId)
    .order('created_at', { ascending: false })
    .limit(50)

  const taskRows = tasksRes.data || []
  const taskIds = taskRows.map((t) => t.id)
  let commentRows = []
  if (taskIds.length) {
    const commentsRes = await supabase
      .from('task_comments')
      .select('id, task_id, user_id, body, created_at')
      .in('task_id', taskIds)
      .order('created_at', { ascending: false })
      .limit(40)
    if (!commentsRes.error) commentRows = commentsRes.data || []
  }

  const taskTitleMap = Object.fromEntries(taskRows.map((t) => [t.id, t.title]))
  const actorIds = new Set()
  for (const t of taskRows) {
    if (t.creator_id) actorIds.add(t.creator_id)
    if (t.completed_by) actorIds.add(t.completed_by)
  }
  for (const item of shoppingRes.data || []) {
    if (item.created_by) actorIds.add(item.created_by)
    if (item.checked_by) actorIds.add(item.checked_by)
  }
  for (const c of commentRows) {
    if (c.user_id) actorIds.add(c.user_id)
  }

  let profileMap = {}
  if (actorIds.size) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url')
      .in('id', [...actorIds])
    profileMap = Object.fromEntries((profiles || []).map((p) => [p.id, p]))
  }

  const profileLabel = (id) => {
    const p = profileMap[id]
    return p?.display_name || (p?.username ? `@${p.username}` : 'Mitglied')
  }

  const avatarFor = (id) => {
    const p = profileMap[id]
    if (!p) return null
    return { name: p.display_name, username: p.username }
  }

  const entries = []

  for (const t of taskRows) {
    entries.push({
      id: `task-created-${t.id}`,
      type: 'task_created',
      at: t.created_at,
      text: t.title,
      user: profileLabel(t.creator_id),
      avatar: avatarFor(t.creator_id),
    })
    if (t.status === 'completed') {
      const actorId = t.completed_by || t.creator_id
      entries.push({
        id: `task-done-${t.id}`,
        type: 'task_completed',
        at: t.completed_at || t.updated_at || t.created_at,
        text: t.title,
        user: profileLabel(actorId),
        avatar: avatarFor(actorId),
      })
    }
  }

  for (const item of shoppingRes.data || []) {
    entries.push({
      id: `shop-add-${item.id}`,
      type: 'shopping_added',
      at: item.created_at,
      text: item.name,
      user: profileLabel(item.created_by),
      avatar: avatarFor(item.created_by),
    })
    if (item.checked) {
      entries.push({
        id: `shop-check-${item.id}`,
        type: 'shopping_checked',
        at: item.updated_at || item.created_at,
        text: item.name,
        user: profileLabel(item.checked_by || item.created_by),
        avatar: avatarFor(item.checked_by || item.created_by),
      })
    }
  }

  for (const c of commentRows) {
    entries.push({
      id: `comment-${c.id}`,
      type: 'comment',
      at: c.created_at,
      text: `${taskTitleMap[c.task_id] || 'Aufgabe'}: ${c.body}`,
      user: profileLabel(c.user_id),
      avatar: avatarFor(c.user_id),
    })
  }

  return entries
    .sort((a, b) => new Date(b.at) - new Date(a.at))
    .slice(0, limit)
}

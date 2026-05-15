/** Statistik für Familiengruppe berechnen */
export function computeGroupStats(tasks = [], members = []) {
  const memberTotal = members.length
  const taskTotal = tasks.length
  const taskOpen = tasks.filter((t) => t.status === 'open')
  const taskDone = tasks.filter((t) => t.status === 'completed')
  const progress = taskTotal > 0 ? Math.round((taskDone.length / taskTotal) * 100) : 0

  const activeIds = new Set()
  for (const m of members) {
    const hasOpenWork = taskOpen.some(
      (t) => t.assignee_id === m.user_id || t.creator_id === m.user_id,
    )
    if (hasOpenWork) activeIds.add(m.user_id)
  }

  const activeMembers = members.filter((m) => activeIds.has(m.user_id))

  return {
    memberTotal,
    activeCount: activeIds.size,
    activeMembers,
    taskTotal,
    taskOpen: taskOpen.length,
    taskDone: taskDone.length,
    progress,
  }
}

/** Rollen-Hierarchie in Familiengruppen */
export const GROUP_ROLES = {
  owner: { label: 'Oberadmin', order: 3, color: 'text-violet-300 bg-violet-500/15' },
  admin: { label: 'Admin', order: 2, color: 'text-amber-300 bg-amber-500/15' },
  member: { label: 'Mitglied', order: 1, color: 'text-zinc-400 bg-zinc-500/10' },
}

export function getRoleMeta(role) {
  return GROUP_ROLES[role] || GROUP_ROLES.member
}

export function isOwner(role) {
  return role === 'owner'
}

export function isAdminOrOwner(role) {
  return role === 'owner' || role === 'admin'
}

/** Darf Ziel entfernen? */
export function canRemoveMember(actorRole, targetRole) {
  if (!actorRole || !targetRole) return false
  if (targetRole === 'owner') return false
  if (actorRole === 'owner') return true
  if (actorRole === 'admin' && targetRole === 'member') return true
  return false
}

/** Darf Admin/Mitglied-Ränge vergeben? */
export function canSetRoles(actorRole) {
  return actorRole === 'owner'
}

/** Anzeige: Legacy admin als owner wenn Gruppenersteller */
export function resolveDisplayRole(member, groupCreatedBy) {
  if (member.user_id === groupCreatedBy && member.role === 'admin') return 'owner'
  return member.role
}

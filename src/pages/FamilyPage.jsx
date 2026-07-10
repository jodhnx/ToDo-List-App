import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
// motion only for list items
import { Plus, Users, Bell, UserPlus, AlertCircle } from 'lucide-react'
import { useGroups } from '../context/GroupsContext'
import { useAuth } from '../context/AuthContext'
import { useProfile } from '../hooks/useProfile'
import { useToast } from '../context/ToastContext'
import { checkGroupsSchema } from '../lib/groupApi'
import GroupCard from '../components/groups/GroupCard'
import CreateGroupModal from '../components/groups/CreateGroupModal'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import { SkeletonGroupList } from '../components/ui/Skeleton'

export default function FamilyPage() {
  const {
    enabled,
    groups,
    invites,
    loading,
    syncing,
    error,
    inviteCount,
    unreadCount,
    createGroup,
    respondInvite,
    refreshAll,
  } = useGroups()
  const { isSupabaseConfigured, user } = useAuth()
  const { needsUsername } = useProfile()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [createOpen, setCreateOpen] = useState(false)
  const [schemaOk, setSchemaOk] = useState(null)
  const [schemaHint, setSchemaHint] = useState('')

  useEffect(() => {
    if (!enabled) return
    checkGroupsSchema().then((r) => {
      setSchemaOk(r.ok)
      if (!r.ok && r.message) setSchemaHint(r.message)
      else if (!r.ok && r.reason === 'missing_tables') {
        setSchemaHint('Führe migration_v4_families.sql und migration_v4_families_fix.sql in Supabase aus.')
      }
    })
  }, [enabled])

  if (!isSupabaseConfigured || !enabled) {
    return (
      <Card>
        <h2 className="text-lg font-semibold text-primary">Familien & Gruppen</h2>
        <p className="mt-2 text-sm text-muted">
          Verbinde Supabase in der <code className="text-indigo-300">.env</code> (VITE_SUPABASE_URL + ANON_KEY),
          dann kannst du Familien erstellen und Aufgaben teilen.
        </p>
      </Card>
    )
  }

  if (!user) {
    return (
      <Card>
        <p className="text-muted">Bitte melde dich an, um eine Familie zu erstellen.</p>
      </Card>
    )
  }

  const handleCreate = async ({ name, icon }) => {
    const group = await createGroup({ name, icon })
    toast(`„${group.name}" erstellt — du bist Admin`, 'success')
    setCreateOpen(false)
    navigate(`/app/family/${group.id}`)
    return group
  }

  const handleInviteResponse = async (invite, accept) => {
    try {
      await respondInvite({
        inviteId: invite.id,
        accept,
        groupName: invite.groups?.name,
        inviterId: invite.inviter_id,
      })
      toast(accept ? 'Beigetreten!' : 'Abgelehnt', accept ? 'success' : 'info')
      if (accept) navigate(`/app/family/${invite.group_id}`)
    } catch (e) {
      toast(e.message, 'error')
    }
  }

  return (
    <div className="space-y-6 pb-4">
      <div className="page-header flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1>Familie & Gruppen</h1>
          <p>Erstelle deine Familie und teile Aufgaben mit anderen</p>
          {syncing && groups.length > 0 && (
            <p className="mt-1 text-xs text-[var(--theme-accent)]">Synchronisiert im Hintergrund…</p>
          )}
        </div>
        <div className="flex gap-2">
          <Link to="/app/notifications">
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] text-white">
                  {unreadCount}
                </span>
              )}
            </Button>
          </Link>
          <Button onClick={() => setCreateOpen(true)} className="gap-2" disabled={schemaOk === false}>
            <Plus className="h-4 w-4" />
            Familie erstellen
          </Button>
        </div>
      </div>

      {schemaOk === false && (
        <Card className="border-amber-500/30 bg-amber-500/10">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 shrink-0 text-amber-400" />
            <div className="text-sm">
              <p className="font-medium text-amber-200">Datenbank-Setup fehlt</p>
              <p className="mt-1 text-muted">{schemaHint}</p>
              <p className="mt-2 text-xs text-muted">
                Supabase → SQL Editor → nacheinander ausführen:{' '}
                <code className="text-indigo-300">migration_v4_families.sql</code>, dann{' '}
                <code className="text-indigo-300">migration_v4_families_fix.sql</code>
              </p>
            </div>
          </div>
        </Card>
      )}

      {needsUsername && (
        <Card className="border-indigo-500/30 bg-indigo-500/10">
          <p className="text-sm text-indigo-200">
            Lege zuerst einen{' '}
            <Link to="/app/profile" className="underline">
              Benutzernamen
            </Link>{' '}
            fest, um andere per @username einzuladen. Familien erstellen funktioniert schon jetzt.
          </p>
        </Card>
      )}

      {invites.length > 0 && (
        <Card>
          <h2 className="mb-3 flex items-center gap-2 font-semibold text-primary">
            <UserPlus className="h-4 w-4 text-indigo-400" />
            Einladungen ({inviteCount})
          </h2>
          <ul className="space-y-3">
            {invites.map((inv) => (
              <li
                key={inv.id}
                className="flex flex-col gap-3 rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium text-primary">{inv.groups?.name}</p>
                  <p className="text-xs text-muted">Gruppeneinladung</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleInviteResponse(inv, true)}>
                    Annehmen
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleInviteResponse(inv, false)}>
                    Ablehnen
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {error && (
        <Card className="border-rose-500/30 bg-rose-500/10">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium text-primary">Gruppen konnten nicht vollständig geladen werden</p>
              <p className="mt-1 text-sm text-muted">{error}</p>
            </div>
            <Button size="sm" variant="secondary" onClick={() => refreshAll()}>
              Erneut laden
            </Button>
          </div>
        </Card>
      )}

      {loading && groups.length === 0 ? (
        <SkeletonGroupList count={3} />
      ) : groups.length === 0 ? (
        <Card className="py-12 text-center">
          <Users className="mx-auto mb-3 h-10 w-10 text-muted" />
          <p className="text-muted">Noch keine Familie — erstelle deine eigene Gruppe und lade später Mitglieder ein.</p>
          <Button className="mt-4 gap-2" onClick={() => setCreateOpen(true)} disabled={schemaOk === false}>
            <Plus className="h-4 w-4" />
            Meine Familie erstellen
          </Button>
        </Card>
      ) : (
        <ul className="space-y-3">
          {groups.map((g, i) => (
            <motion.div
              key={g.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <GroupCard group={g} memberCount={g.member_count} />
            </motion.div>
          ))}
        </ul>
      )}

      <CreateGroupModal open={createOpen} onClose={() => setCreateOpen(false)} onCreate={handleCreate} />
    </div>
  )
}

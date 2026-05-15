import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, Users, Bell, UserPlus } from 'lucide-react'
import { useGroups } from '../context/GroupsContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import GroupCard from '../components/groups/GroupCard'
import CreateGroupModal from '../components/groups/CreateGroupModal'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'

export default function FamilyPage() {
  const { enabled, groups, invites, loading, inviteCount, unreadCount, createGroup, respondInvite, refreshAll } =
    useGroups()
  const { isSupabaseConfigured } = useAuth()
  const { toast } = useToast()
  const [createOpen, setCreateOpen] = useState(false)

  if (!isSupabaseConfigured || !enabled) {
    return (
      <Card>
        <h2 className="text-lg font-semibold text-primary">Familien & Gruppen</h2>
        <p className="mt-2 text-sm text-muted">
          Verbinde Supabase (VITE_SUPABASE_URL + ANON_KEY), führe <code className="text-indigo-300">migration_v4_families.sql</code> aus,
          dann kannst du Gruppen erstellen und Aufgaben teilen.
        </p>
      </Card>
    )
  }

  const handleCreate = async ({ name, icon }) => {
    await createGroup({ name, icon })
    await refreshAll()
    toast('Gruppe erstellt — du bist Admin', 'success')
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
      await refreshAll()
    } catch (e) {
      toast(e.message, 'error')
    }
  }

  return (
    <div className="space-y-6 pb-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Familie & Gruppen</h1>
          <p className="text-sm text-muted">Gemeinsame Aufgaben mit deinen Liebsten</p>
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
          <Button onClick={() => setCreateOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Neue Gruppe
          </Button>
        </div>
      </div>

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

      {loading ? (
        <p className="text-center text-muted">Lädt Gruppen…</p>
      ) : groups.length === 0 ? (
        <Card className="py-12 text-center">
          <Users className="mx-auto mb-3 h-10 w-10 text-muted" />
          <p className="text-muted">Noch keine Gruppe — erstelle eine Familie oder lade andere per Benutzername ein.</p>
          <Button className="mt-4" onClick={() => setCreateOpen(true)}>
            Erste Gruppe erstellen
          </Button>
        </Card>
      ) : (
        <motion.ul className="space-y-3" initial="hidden" animate="show">
          {groups.map((g, i) => (
            <motion.li key={g.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <GroupCard group={g} />
            </motion.li>
          ))}
        </motion.ul>
      )}

      <CreateGroupModal open={createOpen} onClose={() => setCreateOpen(false)} onCreate={handleCreate} />
    </div>
  )
}

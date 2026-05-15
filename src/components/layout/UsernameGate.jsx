import { Navigate, useLocation } from 'react-router-dom'
import { useProfile } from '../../hooks/useProfile'
import { useAuth } from '../../context/AuthContext'

/** Leitet zu Profil-Setup, wenn Supabase-User noch keinen Benutzernamen hat */
export default function UsernameGate({ children }) {
  const { isSupabaseConfigured } = useAuth()
  const { enabled, needsUsername, loading } = useProfile()
  const location = useLocation()

  if (!isSupabaseConfigured || !enabled || loading) return children

  const allowed = ['/app/profile', '/app/settings', '/app/family', '/app/notifications']
  if (needsUsername && !allowed.some((p) => location.pathname.startsWith(p))) {
    return <Navigate to="/app/profile?setup=1" replace />
  }

  return children
}

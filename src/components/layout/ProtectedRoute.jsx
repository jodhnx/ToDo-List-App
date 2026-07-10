import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Skeleton } from '../ui/Skeleton'

/** Leitet nicht eingeloggte Benutzer zur Auth-Seite um */
export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 gradient-mesh px-6">
        <Skeleton className="h-12 w-12 rounded-2xl animate-shimmer" />
        <Skeleton className="h-4 w-32 animate-shimmer" />
      </div>
    )
  }

  if (!user) return <Navigate to="/auth" replace />

  return children
}

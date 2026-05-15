import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/layout/Navbar'
import AuthForm from '../components/auth/AuthForm'

export default function AuthPage() {
  const { user, loading } = useAuth()

  if (!loading && user) return <Navigate to="/app" replace />

  return (
    <div className="min-h-screen gradient-mesh">
      <Navbar />
      <main className="flex min-h-[calc(100vh-73px)] items-center justify-center px-4 py-12">
        <AuthForm />
      </main>
    </div>
  )
}

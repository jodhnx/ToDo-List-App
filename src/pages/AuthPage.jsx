import { Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle2, Sparkles, Shield, Bell, Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import AuthForm from '../components/auth/AuthForm'

const highlights = [
  { icon: Shield, text: 'Geschützte Konten & Sync' },
  { icon: Sparkles, text: 'KI-Assistent für Aufgaben' },
  { icon: Bell, text: 'Push-Erinnerungen' },
]

export default function AuthPage() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center gradient-mesh">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
      </div>
    )
  }

  if (!loading && user) return <Navigate to="/app" replace />

  return (
    <div className="min-h-screen gradient-mesh">
      <div className="mx-auto grid min-h-screen max-w-6xl lg:grid-cols-2">
        {/* Branding */}
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          className="hidden flex-col justify-center px-8 py-16 lg:flex xl:px-16"
        >
          <div className="mb-8 flex items-center gap-3">
            <CheckCircle2 className="h-10 w-10 text-indigo-400" />
            <span className="text-2xl font-bold text-primary">Focus</span>
          </div>
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-primary xl:text-5xl">
            Fokus auf das,
            <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
              {' '}
              was zählt.
            </span>
          </h1>
          <p className="mt-4 max-w-md text-lg text-muted">
            Aufgaben verwalten, KI nutzen und nie wieder eine Deadline verpassen.
          </p>
          <ul className="mt-10 space-y-4">
            {highlights.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-muted">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/15 text-indigo-400">
                  <Icon className="h-4 w-4" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Formular */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col justify-center px-4 py-12 sm:px-8 lg:px-12"
        >
          <div className="mb-6 flex items-center gap-2 lg:hidden">
            <CheckCircle2 className="h-7 w-7 text-indigo-400" />
            <span className="text-xl font-bold text-primary">Focus</span>
          </div>
          <AuthForm />
        </motion.div>
      </div>
    </div>
  )
}

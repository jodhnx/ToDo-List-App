import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  Calendar,
  Filter,
  LayoutDashboard,
  Shield,
  Sparkles,
  Tag,
  Wifi,
  Pin,
} from 'lucide-react'
import Navbar from '../layout/Navbar'
import Button from '../ui/Button'
import Card from '../ui/Card'

const features = [
  {
    icon: Wifi,
    title: 'Online für alle',
    desc: 'Deployen mit Vercel + Supabase — jeder kann sich registrieren und von überall zugreifen.',
  },
  {
    icon: Shield,
    title: 'Geschützte Konten',
    desc: 'Jeder Benutzer sieht nur seine eigenen Aufgaben — sicher mit Supabase Auth & Realtime.',
  },
  {
    icon: Pin,
    title: 'Anpinnen & Bulk',
    desc: 'Wichtige Tasks fixieren, exportieren, alle erledigen oder aufräumen.',
  },
  {
    icon: Tag,
    title: 'Kategorien & Prioritäten',
    desc: 'Schule, Gym, Arbeit, Privat — mit Niedrig, Mittel oder Hoch.',
  },
  {
    icon: Calendar,
    title: 'Fälligkeitsdaten',
    desc: 'Behalte Deadlines im Blick und plane deine Woche strukturiert.',
  },
  {
    icon: Filter,
    title: 'Suche & Filter',
    desc: 'Finde Aufgaben schnell nach Status, Kategorie oder Priorität.',
  },
  {
    icon: LayoutDashboard,
    title: 'Dashboard',
    desc: 'Offene und erledigte Aufgaben mit Fortschrittsbalken auf einen Blick.',
  },
  {
    icon: Sparkles,
    title: 'Modernes UI',
    desc: 'Glassmorphism, Animationen und Dark Mode — minimalistisch wie Notion.',
  },
]

/** Landingpage vor dem Login */
export default function LandingPage() {
  return (
    <div className="min-h-screen gradient-mesh">
      <Navbar showAuth />

      <main className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        {/* Hero */}
        <section className="flex flex-col items-center pt-16 text-center sm:pt-24">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="mb-4 inline-block rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1 text-sm text-indigo-300">
              Produktivität neu gedacht
            </span>
            <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-zinc-50 sm:text-6xl">
              Deine Aufgaben.
              <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                {' '}
                Fokussiert.
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg text-muted">
              Focus vereint To-Dos, Kategorien und ein klares Dashboard — online mit Cloud-Sync
              oder lokal zum Testen. Minimalistisch, schnell, für Handy und Desktop.
            </p>
            <motion.div
              className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Link to="/auth">
                <Button size="lg" className="gap-2">
                  Kostenlos starten
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/auth">
                <Button variant="secondary" size="lg">
                  Anmelden
                </Button>
              </Link>
            </motion.div>
          </motion.div>

          {/* Preview-Karte */}
          <motion.div
            className="mt-16 w-full max-w-2xl"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <Card className="text-left">
              <div className="space-y-3">
                {[
                  { title: 'Mathe-Übung Kapitel 5', cat: 'Schule', done: false },
                  { title: 'Beintraining — 4×12', cat: 'Gym', done: true },
                  { title: 'Projekt-Review vorbereiten', cat: 'Arbeit', done: false },
                ].map((item, i) => (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.1 }}
                    className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/5 px-4 py-3"
                  >
                    <div
                      className={`h-5 w-5 rounded-full border-2 ${
                        item.done ? 'border-indigo-400 bg-indigo-400' : 'border-zinc-500'
                      }`}
                    />
                    <span className={item.done ? 'text-zinc-500 line-through' : 'text-zinc-200'}>
                      {item.title}
                    </span>
                    <span className="ml-auto text-xs text-zinc-500">{item.cat}</span>
                  </motion.div>
                ))}
              </div>
            </Card>
          </motion.div>
        </section>

        {/* Features */}
        <section className="mt-32">
          <h2 className="mb-12 text-center text-2xl font-bold text-zinc-100 sm:text-3xl">
            Alles, was du brauchst
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <Card key={f.title} delay={i * 0.05}>
                <f.icon className="mb-3 h-8 w-8 text-indigo-400" />
                <h3 className="font-semibold text-zinc-100">{f.title}</h3>
                <p className="mt-2 text-sm text-zinc-400">{f.desc}</p>
              </Card>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}

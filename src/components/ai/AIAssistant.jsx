import { useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Loader2, RefreshCw } from 'lucide-react'
import { generateDailyBriefing } from '../../lib/ai'
import { hasAiConfigured } from '../../lib/ai'
import Card from '../ui/Card'
import Button from '../ui/Button'

/** KI-Tagesbriefing auf dem Dashboard */
export default function AIAssistant({ todos }) {
  const [briefing, setBriefing] = useState('')
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    const text = await generateDailyBriefing(todos)
    setBriefing(text)
    setLoading(false)
  }

  return (
    <Card className="relative overflow-hidden border-indigo-500/20">
      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-indigo-500/10 blur-2xl" />
      <div className="relative flex items-start justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-primary">KI-Assistent</h3>
            <p className="text-xs text-muted">
              {hasAiConfigured() ? 'Powered by OpenAI' : 'Smarte lokale Analyse'}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={load} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
        </Button>
      </div>

      {briefing ? (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative mt-4 text-sm leading-relaxed text-primary/90"
        >
          {briefing}
        </motion.p>
      ) : (
        <p className="relative mt-4 text-sm text-muted">
          Tippe auf Aktualisieren für dein persönliches Tages-Briefing.
        </p>
      )}
    </Card>
  )
}

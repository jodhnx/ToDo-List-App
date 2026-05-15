import { useEffect, useState, useCallback } from 'react'
import { Sparkles, Loader2 } from 'lucide-react'
import { generateDailyBriefing, hasAiConfigured } from '../../lib/ai'

/** KI-Tagesbriefing — lädt automatisch, funktioniert auch ohne API-Key */
export default function AIAssistant({ todos }) {
  const [briefing, setBriefing] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const text = await generateDailyBriefing(todos || [])
      setBriefing(text)
    } catch {
      setBriefing('Konnte Briefing nicht laden. Probiere es gleich nochmal.')
    } finally {
      setLoading(false)
    }
  }, [todos])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="rounded-2xl border border-indigo-500/25 bg-gradient-to-br from-indigo-500/10 to-violet-500/5 p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500 shadow-lg shadow-indigo-500/30">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-zinc-50">KI-Tagesplan</h3>
          <p className="text-xs text-zinc-400">
            {hasAiConfigured() ? 'OpenAI aktiv' : 'Smarte Analyse — ohne API-Key'}
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="shrink-0 rounded-lg px-2 py-1 text-xs text-indigo-300 hover:bg-white/5"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Neu'}
        </button>
      </div>

      <div className="mt-3 min-h-[3rem]">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
            Analysiere deine Aufgaben…
          </div>
        ) : (
          <p className="text-sm leading-relaxed text-zinc-200">{briefing}</p>
        )}
      </div>
    </div>
  )
}

import { useEffect, useState, useCallback, useMemo } from 'react'
import { Sparkles, Loader2, Target, Lightbulb } from 'lucide-react'
import { generateDailyBriefing, hasAiConfigured } from '../../lib/ai'

const emptyPlan = {
  headline: '',
  summary: '',
  focus: [],
  stats: { open: 0, overdue: 0, today: 0, high: 0 },
  tip: '',
}

/** KI-Tagesplan — strukturiert, offline-fähig */
export default function AIAssistant({ todos }) {
  const [plan, setPlan] = useState(emptyPlan)
  const [loading, setLoading] = useState(true)

  const todoKey = useMemo(
    () =>
      todos
        .filter((t) => !t.completed)
        .map((t) => `${t.id}:${t.updated_at || t.created_at}`)
        .join('|'),
    [todos],
  )

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await generateDailyBriefing(todos || [])
      setPlan(data)
    } catch {
      setPlan({
        ...emptyPlan,
        headline: 'Briefing nicht verfügbar',
        summary: 'Tippe auf Neu, um es erneut zu laden.',
      })
    } finally {
      setLoading(false)
    }
  }, [todos])

  useEffect(() => {
    load()
  }, [load, todoKey])

  return (
    <div className="rounded-2xl border border-indigo-500/25 bg-gradient-to-br from-indigo-500/10 to-violet-500/5 p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500 shadow-lg shadow-indigo-500/30">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-zinc-50">KI-Tagesplan</h3>
          <p className="text-xs text-zinc-400">
            {hasAiConfigured() ? 'OpenAI · persönlicher Plan' : 'Smart · funktioniert offline'}
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

      {loading ? (
        <div className="mt-4 flex items-center gap-2 text-sm text-zinc-400">
          <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
          Plane deinen Tag…
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          <div>
            <p className="text-base font-semibold text-zinc-50">{plan.headline}</p>
            <p className="mt-1 text-sm text-zinc-300">{plan.summary}</p>
          </div>

          <div className="grid grid-cols-4 gap-2 text-center">
            {[
              { k: 'open', label: 'Offen' },
              { k: 'overdue', label: 'Überf.' },
              { k: 'today', label: 'Heute' },
              { k: 'high', label: 'Hoch' },
            ].map(({ k, label }) => (
              <div key={k} className="rounded-lg bg-white/5 py-2">
                <p className="text-lg font-bold text-zinc-50">{plan.stats?.[k] ?? 0}</p>
                <p className="text-[10px] text-zinc-500">{label}</p>
              </div>
            ))}
          </div>

          {plan.focus?.length > 0 && (
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-indigo-300">
                <Target className="h-3.5 w-3.5" />
                Als Nächstes
              </p>
              <ul className="space-y-2">
                {plan.focus.map((item, i) => (
                  <li
                    key={`${item.title}-${i}`}
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-2"
                  >
                    <p className="text-sm font-medium text-zinc-100">{item.title}</p>
                    <p className="text-xs text-zinc-400">{item.reason}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {plan.tip && (
            <p className="flex gap-2 rounded-lg bg-indigo-500/10 px-3 py-2 text-xs text-indigo-200">
              <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {plan.tip}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

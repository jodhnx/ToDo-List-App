import { useState } from 'react'
import { Sparkles, Loader2, Wand2, ListTree } from 'lucide-react'
import { suggestTaskMeta, improveDescription, suggestSubtasks } from '../../lib/ai'
import { useToast } from '../../context/ToastContext'
import Button from '../ui/Button'

/** KI-Hilfen im Aufgaben-Formular */
export default function AITaskTools({ title, description, onApply }) {
  const [loading, setLoading] = useState(null)
  const { toast } = useToast()

  const run = async (action) => {
    if (!title.trim() && action !== 'improve') {
      toast('Bitte zuerst einen Titel eingeben', 'info')
      return
    }
    setLoading(action)
    try {
      if (action === 'meta') {
        const meta = await suggestTaskMeta(title, description)
        onApply(meta)
        const hints = ['Kategorie & Priorität']
        if (meta.due_date) hints.push('Datum')
        if (meta.due_time) hints.push('Uhrzeit')
        toast(`${hints.join(' & ')} vorgeschlagen`, 'success')
      } else if (action === 'improve') {
        const text = await improveDescription(title, description)
        onApply({ description: text })
        toast('Beschreibung optimiert', 'success')
      } else if (action === 'subtasks') {
        const steps = await suggestSubtasks(title)
        const text = steps.map((s) => `• ${s}`).join('\n')
        onApply({ description: description ? `${description}\n\n${text}` : text })
        toast('Unter-Schritte eingefügt', 'success')
      }
    } catch (e) {
      toast(e.message || 'KI-Fehler', 'error')
    }
    setLoading(null)
  }

  return (
    <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-3">
      <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-indigo-300">
        <Sparkles className="h-3.5 w-3.5" />
        KI-Hilfe
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={!!loading}
          onClick={() => run('meta')}
          className="text-xs"
        >
          {loading === 'meta' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />}
          Vorschlagen
        </Button>
        <Button type="button" variant="ghost" size="sm" disabled={!!loading} onClick={() => run('improve')} className="text-xs">
          {loading === 'improve' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
          Text verbessern
        </Button>
        <Button type="button" variant="ghost" size="sm" disabled={!!loading} onClick={() => run('subtasks')} className="text-xs">
          {loading === 'subtasks' ? <Loader2 className="h-3 w-3 animate-spin" /> : <ListTree className="h-3 w-3" />}
          Schritte
        </Button>
      </div>
    </div>
  )
}

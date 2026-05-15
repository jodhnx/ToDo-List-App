import { getAiApiKey } from './settings'

const SYSTEM = `Du bist ein hilfreicher Produktivitäts-Assistent für eine deutsche To-Do-App.
Antworte immer auf Deutsch, kurz und präzise.
Kategorien: schule, gym, arbeit, privat.
Prioritäten: niedrig, mittel, hoch.`

/** Regelbasierte Vorschläge ohne API */
function smartSuggestLocal(title, description = '') {
  const text = `${title} ${description}`.toLowerCase()
  let category = 'privat'
  let priority = 'mittel'
  let due_date = null

  if (/mathe|physik|chemie|bio|schule|uni|vorlesung|hausaufgabe|klausur|prüfung|referat/.test(text)) {
    category = 'schule'
  } else if (/gym|training|sport|laufen|workout|fitness|kraft|cardio/.test(text)) {
    category = 'gym'
  } else if (/arbeit|meeting|projekt|deadline|büro|kunde|präsentation|chef|kolleg/.test(text)) {
    category = 'arbeit'
  } else if (/einkauf|arzt|familie|haushalt|putzen|wohnung/.test(text)) {
    category = 'privat'
  }

  if (/dringend|wichtig|asap|sofort|morgen|heute|deadline|überfällig/.test(text)) priority = 'hoch'
  else if (/optional|später|irgendwann|mal|entspannt/.test(text)) priority = 'niedrig'

  if (/heute/.test(text)) {
    due_date = new Date().toISOString().slice(0, 10)
  } else if (/morgen/.test(text)) {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    due_date = d.toISOString().slice(0, 10)
  }

  return { category, priority, ...(due_date ? { due_date } : {}) }
}

async function callOpenAI(messages, maxTokens = 400) {
  const apiKey = getAiApiKey()
  if (!apiKey) return null

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'system', content: SYSTEM }, ...messages],
      max_tokens: maxTokens,
      temperature: 0.4,
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || `API-Fehler ${res.status}`)
  }

  const data = await res.json()
  return data.choices?.[0]?.message?.content?.trim() || ''
}

/** Kategorie & Priorität aus Titel vorschlagen */
export async function suggestTaskMeta(title, description = '') {
  if (!title.trim()) return smartSuggestLocal('', description)

  const apiKey = getAiApiKey()
  if (!apiKey) return smartSuggestLocal(title, description)

  try {
    const raw = await callOpenAI([
      {
        role: 'user',
        content: `Analysiere diese Aufgabe und antworte NUR als JSON:
{"category":"schule|gym|arbeit|privat","priority":"niedrig|mittel|hoch","due_date":"YYYY-MM-DD oder null"}
Titel: ${title}
Beschreibung: ${description || '-'}`,
      },
    ], 80)

    const json = JSON.parse(raw.replace(/```json?|```/g, '').trim())
    if (['schule', 'gym', 'arbeit', 'privat'].includes(json.category)) {
      const out = {
        category: json.category,
        priority: ['niedrig', 'mittel', 'hoch'].includes(json.priority) ? json.priority : 'mittel',
      }
      if (json.due_date && json.due_date !== 'null') {
        const d = String(json.due_date).slice(0, 10)
        if (/^\d{4}-\d{2}-\d{2}$/.test(d)) out.due_date = d
      }
      return out
    }
  } catch {
    /* Fallback */
  }
  return smartSuggestLocal(title, description)
}

/** Beschreibung verbessern / erweitern */
export async function improveDescription(title, description = '') {
  const apiKey = getAiApiKey()
  if (!apiKey) {
    if (!description.trim()) {
      return `• Ziel definieren\n• Nächster Schritt für: ${title}\n• Zeit einplanen`
    }
    return description
  }

  return callOpenAI([
    {
      role: 'user',
      content: `Verbessere oder erstelle eine kurze, strukturierte Beschreibung (max. 4 Bulletpoints) für:
Titel: ${title}
Aktuell: ${description || '(leer)'}`,
    },
  ])
}

/** Tages-Briefing aus offenen Aufgaben */
export async function generateDailyBriefing(todos) {
  const open = todos.filter((t) => !t.completed)
  if (open.length === 0) return 'Alles erledigt — stark! Zeit für eine Pause.'

  const apiKey = getAiApiKey()
  const list = open
    .slice(0, 12)
    .map((t) => `- ${t.title} (${t.priority}, ${t.category}${t.due_date ? `, fällig ${t.due_date}` : ''})`)
    .join('\n')

  if (!apiKey) {
    const overdue = open.filter((t) => {
      if (!t.due_date) return false
      const due = new Date(t.due_date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      due.setHours(0, 0, 0, 0)
      return due < today
    })
    const todayList = open.filter((t) => {
      if (!t.due_date) return false
      return new Date(t.due_date).toDateString() === new Date().toDateString()
    })
    const focus = (overdue.length ? overdue : todayList.length ? todayList : open.filter((t) => t.priority === 'hoch'))
      .slice(0, 3)
      .map((t) => t.title)
    const parts = [`Du hast ${open.length} offene Aufgabe${open.length === 1 ? '' : 'n'}.`]
    if (overdue.length) parts.push(`${overdue.length} überfällig — zuerst erledigen.`)
    else if (todayList.length) parts.push(`${todayList.length} heute fällig.`)
    if (focus.length) parts.push(`Start: ${focus.join(', ')}.`)
    return parts.join(' ')
  }

  try {
    return await callOpenAI([
      {
        role: 'user',
        content: `Erstelle ein motivierendes Tages-Briefing (3–5 Sätze) basierend auf diesen Aufgaben:\n${list}`,
      },
    ], 250)
  } catch (e) {
    return `Briefing nicht verfügbar: ${e.message}`
  }
}

/** Unteraufgaben vorschlagen */
export async function suggestSubtasks(title) {
  const apiKey = getAiApiKey()
  if (!apiKey) {
    return ['Planen', 'Umsetzen', 'Prüfen'].map((s) => `${s}: ${title}`)
  }

  try {
    const raw = await callOpenAI([
      {
        role: 'user',
        content: `Schlage 3–5 konkrete Unter-Schritte für "${title}" vor. Antworte als JSON-Array von Strings, z.B. ["Schritt 1","Schritt 2"]`,
      },
    ], 200)
    const arr = JSON.parse(raw.replace(/```json?|```/g, '').trim())
    if (Array.isArray(arr)) return arr.slice(0, 6)
  } catch {
    /* fallback */
  }
  return ['Vorbereiten', 'Durchführen', 'Abschließen']
}

export function hasAiConfigured() {
  return Boolean(getAiApiKey())
}

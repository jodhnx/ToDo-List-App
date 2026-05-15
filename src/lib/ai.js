import { getAiApiKey } from './settings'
import { isDueToday, isOverdue } from './todoUtils'
import { formatDueLabel } from './dateTime'

const SYSTEM = `Du bist ein hilfreicher Produktivitäts-Assistent für eine deutsche To-Do-App.
Antworte immer auf Deutsch, kurz und präzise.
Kategorien: schule, gym, arbeit, privat.
Prioritäten: niedrig, mittel, hoch.`

const priorityOrder = { hoch: 0, mittel: 1, niedrig: 2 }

function sortByUrgency(list) {
  return [...list].sort((a, b) => {
    const oa = isOverdue(a) ? 0 : 1
    const ob = isOverdue(b) ? 0 : 1
    if (oa !== ob) return oa - ob
    const ta = isDueToday(a) ? 0 : 1
    const tb = isDueToday(b) ? 0 : 1
    if (ta !== tb) return ta - tb
    return (priorityOrder[a.priority] ?? 1) - (priorityOrder[b.priority] ?? 1)
  })
}

/** Regelbasierte Vorschläge ohne API */
function smartSuggestLocal(title, description = '') {
  const text = `${title} ${description}`.toLowerCase()
  let category = 'privat'
  let priority = 'mittel'
  let due_date = null
  let due_time = null

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

  const timeMatch = text.match(/(\d{1,2})[.:](\d{2})\s*uhr?|\bum\s*(\d{1,2})\b/)
  if (timeMatch) {
    const h = String(timeMatch[1] || timeMatch[3]).padStart(2, '0')
    const m = String(timeMatch[2] || '00').padStart(2, '0')
    due_time = `${h}:${m}`
  }

  return {
    category,
    priority,
    ...(due_date ? { due_date } : {}),
    ...(due_time ? { due_time, useTime: true } : {}),
  }
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

export async function suggestTaskMeta(title, description = '') {
  if (!title.trim()) return smartSuggestLocal('', description)

  const apiKey = getAiApiKey()
  if (!apiKey) return smartSuggestLocal(title, description)

  try {
    const raw = await callOpenAI([
      {
        role: 'user',
        content: `Analysiere diese Aufgabe und antworte NUR als JSON:
{"category":"schule|gym|arbeit|privat","priority":"niedrig|mittel|hoch","due_date":"YYYY-MM-DD oder null","due_time":"HH:MM oder null"}
Titel: ${title}
Beschreibung: ${description || '-'}`,
      },
    ], 100)

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
      if (json.due_time && /^\d{2}:\d{2}$/.test(json.due_time)) {
        out.due_time = json.due_time
        out.useTime = true
      }
      return out
    }
  } catch {
    /* Fallback */
  }
  return smartSuggestLocal(title, description)
}

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

function buildLocalBriefing(todos) {
  const open = todos.filter((t) => !t.completed)
  if (open.length === 0) {
    return {
      headline: 'Alles erledigt',
      summary: 'Keine offenen Aufgaben — gönn dir eine Pause.',
      focus: [],
      stats: { open: 0, overdue: 0, today: 0, high: 0 },
      tip: 'Neue Ziele kannst du jederzeit unter Aufgaben anlegen.',
    }
  }

  const overdue = open.filter(isOverdue)
  const today = open.filter(isDueToday)
  const high = open.filter((t) => t.priority === 'hoch')
  const sorted = sortByUrgency(open)
  const focus = sorted.slice(0, 4).map((t) => {
    let reason = 'Hohe Priorität'
    if (isOverdue(t)) reason = 'Überfällig'
    else if (isDueToday(t)) reason = t.due_time ? `Heute um ${t.due_time}` : 'Heute fällig'
    else if (t.due_time) reason = `Fällig ${formatDueLabel(t)}`
    return { title: t.title, reason }
  })

  let headline = `${open.length} Aufgabe${open.length === 1 ? '' : 'n'} offen`
  if (overdue.length) headline = `${overdue.length} überfällig — zuerst erledigen`
  else if (today.length) headline = `${today.length} heute auf dem Plan`

  const summaryParts = []
  if (overdue.length) summaryParts.push(`${overdue.length} überfällig`)
  if (today.length) summaryParts.push(`${today.length} heute`)
  if (high.length) summaryParts.push(`${high.length} mit hoher Priorität`)

  return {
    headline,
    summary: summaryParts.length ? summaryParts.join(' · ') : 'Gut sortiert — Schritt für Schritt.',
    focus,
    stats: {
      open: open.length,
      overdue: overdue.length,
      today: today.length,
      high: high.length,
    },
    tip:
      overdue.length > 0
        ? 'Starte mit der ältesten überfälligen Aufgabe.'
        : today.length > 0
          ? 'Plane zuerst die Aufgaben mit Uhrzeit — die sind am zeitkritischsten.'
          : 'Setze bei wichtigen Aufgaben ein Fälligkeitsdatum oder eine Uhrzeit.',
  }
}

/** Strukturierter Tagesplan { headline, summary, focus[], stats, tip } */
export async function generateDailyBriefing(todos) {
  const open = todos.filter((t) => !t.completed)
  if (open.length === 0) return buildLocalBriefing(todos)

  const apiKey = getAiApiKey()
  const local = buildLocalBriefing(todos)

  if (!apiKey) return local

  const list = sortByUrgency(open)
    .slice(0, 12)
    .map(
      (t) =>
        `- ${t.title} (${t.priority}, ${t.category}${formatDueLabel(t) ? `, ${formatDueLabel(t)}` : ''})`,
    )
    .join('\n')

  try {
    const raw = await callOpenAI(
      [
        {
          role: 'user',
          content: `Erstelle einen Tagesplan. Antworte NUR als JSON:
{"headline":"kurz","summary":"1 Satz","focus":[{"title":"...","reason":"..."}],"tip":"1 Satz"}
Max. 3 focus-Einträge. Aufgaben:
${list}`,
        },
      ],
      320,
    )

    const json = JSON.parse(raw.replace(/```json?|```/g, '').trim())
    return {
      headline: json.headline || local.headline,
      summary: json.summary || local.summary,
      focus: Array.isArray(json.focus) ? json.focus.slice(0, 4) : local.focus,
      stats: local.stats,
      tip: json.tip || local.tip,
    }
  } catch {
    return local
  }
}

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

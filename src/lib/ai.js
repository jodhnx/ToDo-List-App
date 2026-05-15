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

  if (/mathe|physik|schule|uni|vorlesung|hausaufgabe|klausur|prüfung/.test(text)) category = 'schule'
  else if (/gym|training|sport|laufen|workout|fitness/.test(text)) category = 'gym'
  else if (/arbeit|meeting|projekt|deadline|büro|kunde|präsentation/.test(text)) category = 'arbeit'

  if (/dringend|wichtig|asap|sofort|morgen|heute|deadline/.test(text)) priority = 'hoch'
  else if (/optional|später|irgendwann|mal/.test(text)) priority = 'niedrig'

  return { category, priority }
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
        content: `Analysiere diese Aufgabe und antworte NUR als JSON: {"category":"schule|gym|arbeit|privat","priority":"niedrig|mittel|hoch"}
Titel: ${title}
Beschreibung: ${description || '-'}`,
      },
    ], 80)

    const json = JSON.parse(raw.replace(/```json?|```/g, '').trim())
    if (['schule', 'gym', 'arbeit', 'privat'].includes(json.category)) {
      return {
        category: json.category,
        priority: ['niedrig', 'mittel', 'hoch'].includes(json.priority) ? json.priority : 'mittel',
      }
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
    const high = open.filter((t) => t.priority === 'hoch').length
    return `Du hast ${open.length} offene Aufgaben${high ? `, davon ${high} mit hoher Priorität` : ''}. Starte mit der wichtigsten.`
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

import { getSettings } from './settings'
import { isDueToday, isOverdue } from './todoUtils'

const SHOWN_KEY = 'focus_notif_shown'
const REMINDER_SHOWN_KEY = 'focus_reminders_shown'
const GROUP_REMINDER_SHOWN_KEY = 'focus_group_reminders_shown'

/** Sichere Referenz — auf iOS/Safari oft nicht verfügbar (sonst ReferenceError) */
function getNotificationAPI() {
  if (typeof window === 'undefined') return null
  try {
    if (typeof Notification !== 'undefined') return Notification
  } catch {
    return null
  }
  return null
}

function getPermission() {
  const N = getNotificationAPI()
  if (!N) return 'unsupported'
  try {
    return N.permission || 'default'
  } catch {
    return 'unsupported'
  }
}

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

function getShownToday() {
  try {
    const data = JSON.parse(localStorage.getItem(SHOWN_KEY) || '{}')
    return data[todayKey()] || []
  } catch {
    return []
  }
}

function markShown(id) {
  try {
    const data = JSON.parse(localStorage.getItem(SHOWN_KEY) || '{}')
    const day = todayKey()
    data[day] = [...(data[day] || []), id]
    localStorage.setItem(SHOWN_KEY, JSON.stringify(data))
  } catch {
    /* ignore */
  }
}

function getShownReminders() {
  try {
    return JSON.parse(localStorage.getItem(REMINDER_SHOWN_KEY) || '[]')
  } catch {
    return []
  }
}

function markReminderShown(id) {
  try {
    const shown = new Set(getShownReminders())
    shown.add(id)
    localStorage.setItem(REMINDER_SHOWN_KEY, JSON.stringify([...shown]))
  } catch {
    /* ignore */
  }
}

function getShownGroupReminders() {
  try {
    return JSON.parse(localStorage.getItem(GROUP_REMINDER_SHOWN_KEY) || '[]')
  } catch {
    return []
  }
}

function markGroupReminderShown(id) {
  try {
    const shown = new Set(getShownGroupReminders())
    shown.add(id)
    localStorage.setItem(GROUP_REMINDER_SHOWN_KEY, JSON.stringify([...shown]))
  } catch {
    /* ignore */
  }
}

export function isNotificationSupported() {
  return getNotificationAPI() !== null
}

export async function requestNotificationPermission() {
  const N = getNotificationAPI()
  if (!N) return 'unsupported'
  try {
    if (N.permission === 'granted') return 'granted'
    if (N.permission === 'denied') return 'denied'
    if (typeof N.requestPermission === 'function') {
      return await N.requestPermission()
    }
  } catch (e) {
    console.warn('Notification permission:', e)
  }
  return 'denied'
}

export function getNotificationPermission() {
  return getPermission()
}

/** Service Worker — optional, Fehler werden abgefangen */
export async function registerServiceWorker() {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return null
  try {
    return await navigator.serviceWorker.register('/sw.js', { scope: '/' })
  } catch (e) {
    console.warn('SW registration failed:', e)
    return null
  }
}

function showNotification(title, body, tag) {
  if (getPermission() !== 'granted') return

  const opts = {
    body,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: tag || 'focus',
    renotify: true,
  }

  try {
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.ready
        .then((reg) => {
          if (reg?.showNotification) reg.showNotification(title, opts)
        })
        .catch(() => {
          const N = getNotificationAPI()
          if (N) new N(title, opts)
        })
      return
    }
    const N = getNotificationAPI()
    if (N) new N(title, opts)
  } catch (e) {
    console.warn('showNotification:', e)
  }
}

function formatTime(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
}

/** Offene Todos prüfen und Push senden */
export function checkAndNotifyTodos(todos) {
  if (!isNotificationSupported() || getPermission() !== 'granted') return

  const settings = getSettings()
  if (!settings.notifications) return

  const shown = getShownToday()
  const open = (todos || []).filter((t) => !t.completed)

  if (settings.notifyOverdue) {
    const overdue = open.filter(isOverdue)
    if (overdue.length > 0 && !shown.includes('overdue-batch')) {
      showNotification(
        'Überfällige Aufgaben',
        overdue.length === 1
          ? overdue[0].title
          : `${overdue.length} Aufgaben sind überfällig`,
        'overdue-batch',
      )
      markShown('overdue-batch')
    }
  }

  if (settings.notifyToday) {
    open.filter(isDueToday).forEach((t) => {
      const tag = `today-${t.id}`
      if (!shown.includes(tag)) {
        showNotification('Heute fällig', t.title, tag)
        markShown(tag)
      }
    })
  }
}

/** Einzelne Aufgabe zum eingestellten Erinnerungszeitpunkt melden */
export function checkReminderTodos(todos) {
  if (!isNotificationSupported() || getPermission() !== 'granted') return

  const settings = getSettings()
  if (!settings.notifications) return

  const shown = getShownReminders()
  const now = Date.now()

  ;(todos || [])
    .filter((t) => !t.completed && t.reminder_at && !shown.includes(String(t.id)))
    .forEach((t) => {
      const reminderTime = new Date(t.reminder_at).getTime()
      if (Number.isNaN(reminderTime) || reminderTime > now) return

      showNotification('Aufgaben-Erinnerung', t.title, `reminder-${t.id}`)
      markReminderShown(String(t.id))
    })
}

export function checkSharedTaskReminders(tasks, currentUserId) {
  if (!currentUserId || !isNotificationSupported() || getPermission() !== 'granted') return

  const settings = getSettings()
  if (!settings.notifications) return

  const shown = getShownGroupReminders()
  const now = Date.now()
  const day = todayKey()

  ;(tasks || [])
    .filter((t) => {
      if (t.status === 'completed') return false
      if (!t.notify_enabled || !t.reminder_at) return false
      return t.assignee_id === currentUserId
    })
    .forEach((task) => {
      const reminderAt = new Date(task.reminder_at).getTime()
      if (Number.isNaN(reminderAt)) return

      const notifyAt = task.reminder_early ? reminderAt - 10 * 60 * 1000 : reminderAt
      if (notifyAt > now) return

      const key = task.reminder_repeat ? `group-${task.id}-${day}` : `group-${task.id}`
      if (shown.includes(key)) return

      const from = task.creator?.display_name || task.creator?.username || 'Deine Familie'
      const time = formatTime(task.reminder_at)
      showNotification(
        'Familien-Erinnerung',
        `${from} erinnert dich an: ${task.title}${time ? ` um ${time}` : ''}`,
        key,
      )
      markGroupReminderShown(key)
    })
}

/** Morgen-Briefing um eingestellte Stunde */
export function checkMorningBriefing(todos) {
  if (!isNotificationSupported() || getPermission() !== 'granted') return

  const settings = getSettings()
  if (!settings.notifications || !settings.notifyMorning) return

  const hour = new Date().getHours()
  if (hour !== settings.morningHour) return
  if (getShownToday().includes('morning')) return

  const open = (todos || []).filter((t) => !t.completed).length
  if (open === 0) return

  showNotification(
    'Guten Morgen!',
    `Du hast ${open} offene Aufgabe${open === 1 ? '' : 'n'} für heute.`,
    'morning',
  )
  markShown('morning')
}

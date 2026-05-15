import { getSettings } from './settings'
import { isDueToday, isOverdue } from './todoUtils'

const SHOWN_KEY = 'focus_notif_shown'

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
  const data = JSON.parse(localStorage.getItem(SHOWN_KEY) || '{}')
  const day = todayKey()
  data[day] = [...(data[day] || []), id]
  localStorage.setItem(SHOWN_KEY, JSON.stringify(data))
}

export function isNotificationSupported() {
  return typeof window !== 'undefined' && 'Notification' in window
}

export async function requestNotificationPermission() {
  if (!isNotificationSupported()) return 'denied'
  if (Notification.permission === 'granted') return 'granted'
  if (Notification.permission === 'denied') return 'denied'
  return Notification.requestPermission()
}

export function getNotificationPermission() {
  if (!isNotificationSupported()) return 'unsupported'
  return Notification.permission
}

/** Service Worker für Hintergrund-Benachrichtigungen registrieren */
export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return null
  try {
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
    return reg
  } catch (e) {
    console.warn('SW registration failed:', e)
    return null
  }
}

function showNotification(title, body, tag) {
  if (Notification.permission !== 'granted') return

  const opts = {
    body,
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    tag,
    renotify: true,
  }

  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.ready.then((reg) => {
      reg.showNotification(title, opts)
    })
  } else {
    new Notification(title, opts)
  }
}

/** Offene Todos prüfen und Push senden */
export function checkAndNotifyTodos(todos) {
  const settings = getSettings()
  if (!settings.notifications || Notification.permission !== 'granted') return

  const shown = getShownToday()
  const open = todos.filter((t) => !t.completed)

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
    const today = open.filter(isDueToday)
    today.forEach((t) => {
      const tag = `today-${t.id}`
      if (!shown.includes(tag)) {
        showNotification('Heute fällig', t.title, tag)
        markShown(tag)
      }
    })
  }
}

/** Morgen-Briefing um eingestellte Stunde */
export function checkMorningBriefing(todos) {
  const settings = getSettings()
  if (!settings.notifications || !settings.notifyMorning) return
  if (Notification.permission !== 'granted') return

  const hour = new Date().getHours()
  if (hour !== settings.morningHour) return
  if (getShownToday().includes('morning')) return

  const open = todos.filter((t) => !t.completed).length
  if (open === 0) return

  showNotification(
    'Guten Morgen!',
    `Du hast ${open} offene Aufgabe${open === 1 ? '' : 'n'} für heute.`,
    'morning',
  )
  markShown('morning')
}

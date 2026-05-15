import { useEffect } from 'react'
import {
  registerServiceWorker,
  checkAndNotifyTodos,
  checkMorningBriefing,
} from '../lib/notifications'
import { getSettings } from '../lib/settings'

/** Push-Benachrichtigungen für fällige Aufgaben */
export function useNotifications(todos) {
  useEffect(() => {
    registerServiceWorker()
  }, [])

  useEffect(() => {
    if (!todos?.length) return
    const settings = getSettings()
    if (!settings.notifications) return

    checkAndNotifyTodos(todos)
    checkMorningBriefing(todos)

    const interval = setInterval(() => {
      checkAndNotifyTodos(todos)
      checkMorningBriefing(todos)
    }, 60_000 * 15) // alle 15 Min

    return () => clearInterval(interval)
  }, [todos])
}

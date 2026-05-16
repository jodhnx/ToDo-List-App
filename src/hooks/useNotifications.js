import { useEffect } from 'react'
import {
  registerServiceWorker,
  checkAndNotifyTodos,
  checkMorningBriefing,
  checkReminderTodos,
  isNotificationSupported,
} from '../lib/notifications'
import { getSettings } from '../lib/settings'

/** Push-Benachrichtigungen — nur wenn die API im Browser existiert */
export function useNotifications(todos) {
  useEffect(() => {
    if (!isNotificationSupported()) return
    registerServiceWorker()
  }, [])

  useEffect(() => {
    if (!isNotificationSupported()) return
    if (!todos?.length) return

    const settings = getSettings()
    if (!settings.notifications) return

    try {
      checkAndNotifyTodos(todos)
      checkMorningBriefing(todos)
      checkReminderTodos(todos)
    } catch (e) {
      console.warn('Notifications:', e)
    }

    const interval = setInterval(() => {
      try {
        checkAndNotifyTodos(todos)
        checkMorningBriefing(todos)
        checkReminderTodos(todos)
      } catch (e) {
        console.warn('Notifications:', e)
      }
    }, 60_000)

    return () => clearInterval(interval)
  }, [todos])
}

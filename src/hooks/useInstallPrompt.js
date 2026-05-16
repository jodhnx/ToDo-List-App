import { useEffect, useState } from 'react'

function isStandalone() {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  )
}

export function useInstallPrompt() {
  const [promptEvent, setPromptEvent] = useState(null)
  const [installed, setInstalled] = useState(() => (typeof window === 'undefined' ? false : isStandalone()))

  useEffect(() => {
    const onBeforeInstallPrompt = (event) => {
      event.preventDefault()
      setPromptEvent(event)
    }

    const onInstalled = () => {
      setInstalled(true)
      setPromptEvent(null)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const install = async () => {
    if (!promptEvent) return false
    promptEvent.prompt()
    const choice = await promptEvent.userChoice
    setPromptEvent(null)
    return choice?.outcome === 'accepted'
  }

  return {
    canInstall: !!promptEvent,
    installed,
    install,
  }
}

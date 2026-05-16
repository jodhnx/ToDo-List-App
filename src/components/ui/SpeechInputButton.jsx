import { useEffect, useRef, useState } from 'react'
import { Loader2, Mic, Square } from 'lucide-react'

function getSpeechRecognition() {
  if (typeof window === 'undefined') return null
  return window.SpeechRecognition || window.webkitSpeechRecognition || null
}

export default function SpeechInputButton({
  onTranscript,
  label = 'Sprache aufnehmen',
  className = '',
}) {
  const recognitionRef = useRef(null)
  const silenceTimerRef = useRef(null)
  const [supported, setSupported] = useState(() => Boolean(getSpeechRecognition()))
  const [preparing, setPreparing] = useState(false)
  const [listening, setListening] = useState(false)
  const [preview, setPreview] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    setSupported(Boolean(getSpeechRecognition()))
    return () => {
      window.clearTimeout(silenceTimerRef.current)
      recognitionRef.current?.abort?.()
    }
  }, [])

  const stop = () => {
    window.clearTimeout(silenceTimerRef.current)
    recognitionRef.current?.stop?.()
    setListening(false)
    setPreparing(false)
  }

  const armSilenceStop = () => {
    window.clearTimeout(silenceTimerRef.current)
    silenceTimerRef.current = window.setTimeout(() => {
      recognitionRef.current?.stop?.()
    }, 3500)
  }

  const start = async () => {
    const SpeechRecognition = getSpeechRecognition()
    if (!SpeechRecognition || listening || preparing) return

    setError('')
    setPreparing(true)

    if (navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        stream.getTracks().forEach((track) => track.stop())
      } catch {
        setError('Mikrofon-Zugriff wurde nicht erlaubt. Bitte erlaube das Mikrofon in den Browser-Einstellungen.')
        setPreparing(false)
        return
      }
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'de-DE'
    recognition.continuous = false
    recognition.interimResults = true

    recognition.onstart = () => {
      setPreview('')
      setPreparing(false)
      setListening(true)
      armSilenceStop()
    }

    recognition.onresult = (event) => {
      let interim = ''
      let finalText = ''

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const text = event.results[i][0]?.transcript || ''
        if (event.results[i].isFinal) finalText += text
        else interim += text
      }

      setPreview(interim || finalText)
      if (finalText.trim()) onTranscript(finalText.trim())
      if ((interim || finalText).trim()) armSilenceStop()
    }

    recognition.onerror = (event) => {
      setListening(false)
      setPreparing(false)
      setPreview('')
      window.clearTimeout(silenceTimerRef.current)
      if (event.error === 'not-allowed') {
        setError('Mikrofon-Zugriff wurde blockiert. Bitte erlaube das Mikrofon und versuche es erneut.')
      } else if (event.error === 'no-speech') {
        setError('Ich habe nichts gehört. Bitte sprich etwas deutlicher oder näher am Mikrofon.')
      } else {
        setError('Die Sprachaufnahme konnte nicht gestartet werden. Bitte versuche es erneut.')
      }
    }

    recognition.onend = () => {
      setListening(false)
      setPreparing(false)
      setPreview('')
      window.clearTimeout(silenceTimerRef.current)
    }

    recognitionRef.current = recognition
    try {
      recognition.start()
    } catch {
      setPreparing(false)
      setError('Die Sprachaufnahme läuft bereits oder konnte nicht gestartet werden.')
    }
  }

  if (!supported) {
    return (
      <p className="text-xs text-muted">
        Spracheingabe wird in diesem Browser leider nicht unterstützt.
      </p>
    )
  }

  return (
    <div className={`space-y-1.5 ${className}`}>
      <button
        type="button"
        onClick={listening ? stop : start}
        disabled={preparing}
        className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition ${
          listening
            ? 'border-rose-500/40 bg-rose-500/10 text-rose-300'
            : 'border-indigo-500/30 bg-indigo-500/10 text-indigo-300 hover:border-indigo-400/60'
        }`}
      >
        {preparing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : listening ? (
          <Square className="h-4 w-4" />
        ) : (
          <Mic className="h-4 w-4" />
        )}
        {preparing ? 'Mikrofon wird vorbereitet...' : listening ? 'Aufnahme stoppen' : label}
      </button>
      {preview && <p className="text-xs text-muted">Erkannt: {preview}</p>}
      {error && <p className="text-xs text-rose-300">{error}</p>}
    </div>
  )
}

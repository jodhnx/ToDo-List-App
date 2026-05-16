import { useEffect, useRef, useState } from 'react'
import { Mic, Square } from 'lucide-react'

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
  const [supported, setSupported] = useState(false)
  const [listening, setListening] = useState(false)
  const [preview, setPreview] = useState('')

  useEffect(() => {
    setSupported(Boolean(getSpeechRecognition()))
    return () => {
      recognitionRef.current?.abort?.()
    }
  }, [])

  const stop = () => {
    recognitionRef.current?.stop?.()
    setListening(false)
  }

  const start = () => {
    const SpeechRecognition = getSpeechRecognition()
    if (!SpeechRecognition || listening) return

    const recognition = new SpeechRecognition()
    recognition.lang = 'de-DE'
    recognition.continuous = false
    recognition.interimResults = true

    recognition.onstart = () => {
      setPreview('')
      setListening(true)
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
    }

    recognition.onerror = () => {
      setListening(false)
      setPreview('')
    }

    recognition.onend = () => {
      setListening(false)
      setPreview('')
    }

    recognitionRef.current = recognition
    recognition.start()
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
        className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition ${
          listening
            ? 'border-rose-500/40 bg-rose-500/10 text-rose-300'
            : 'border-indigo-500/30 bg-indigo-500/10 text-indigo-300 hover:border-indigo-400/60'
        }`}
      >
        {listening ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        {listening ? 'Aufnahme stoppen' : label}
      </button>
      {preview && <p className="text-xs text-muted">Erkannt: {preview}</p>}
    </div>
  )
}

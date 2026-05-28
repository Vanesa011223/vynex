'use client'
import { useState, useRef, useEffect, useActionState } from 'react'
import { updateTeamContext } from '@/app/actions/calendar'

type Message = { role: 'user' | 'assistant'; content: string }

type Props = {
  initialMessages: Message[]
  teamContext: {
    teamName: string
    season: string
    competition: string
    playingStyle: string
    weekMessage: string
  } | null
}

export default function VAYNEXChat({ initialMessages, teamContext }: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showContext, setShowContext] = useState(!teamContext?.playingStyle)
  const [ctxState, ctxAction, ctxPending] = useActionState(updateTeamContext, undefined)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text || loading) return

    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: text }])
    setLoading(true)

    try {
      const res = await fetch('/api/VAYNEX', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      })

      if (!res.ok) {
        const err = await res.json()
        setMessages(prev => [...prev, { role: 'assistant', content: err.error ?? 'Error al conectar con VAYNEX.' }])
        return
      }

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let assistantMsg = ''

      setMessages(prev => [...prev, { role: 'assistant', content: '' }])

      while (reader) {
        const { done, value } = await reader.read()
        if (done) break
        assistantMsg += decoder.decode(value)
        setMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = { role: 'assistant', content: assistantMsg }
          return updated
        })
      }
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as unknown as React.FormEvent)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-5rem)] max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-violet-600 flex items-center justify-center text-white font-bold text-sm">VX</div>
          <div>
            <p className="font-semibold text-white text-sm">VAYNEX</p>
            <p className="text-xs text-slate-400">Tu staff de IA · {teamContext?.teamName ?? 'Mi equipo'}</p>
          </div>
        </div>
        <button
          onClick={() => setShowContext(v => !v)}
          className="text-xs text-slate-400 hover:text-violet-400 transition-colors bg-slate-800 px-3 py-1.5 rounded-lg"
        >
          ⚙ Contexto del equipo
        </button>
      </div>

      {/* Context panel */}
      {showContext && (
        <div className="border-b border-slate-800 bg-slate-900/50">
          <form action={ctxAction} className="p-4 space-y-3">
            <p className="text-xs text-violet-400 font-medium">Contexto del equipo — VAYNEX lo usará en cada respuesta</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              <input name="teamName" defaultValue={teamContext?.teamName ?? ''} placeholder="Nombre del equipo"
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-violet-500" />
              <input name="season" defaultValue={teamContext?.season ?? '2025/26'} placeholder="Temporada"
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-violet-500" />
              <input name="competition" defaultValue={teamContext?.competition ?? ''} placeholder="Competición"
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-violet-500" />
            </div>
            <textarea name="playingStyle" defaultValue={teamContext?.playingStyle ?? ''} rows={3}
              placeholder="Describe tu modelo de juego: sistema (ej. 4-3-3), presión alta/baja, salida desde atrás, transiciones rápidas, estilo defensivo..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-violet-500 resize-none" />
            <div className="flex items-center gap-3">
              <textarea name="weekMessage" defaultValue={teamContext?.weekMessage ?? ''} rows={2}
                placeholder="Mensaje de la semana para las jugadoras (opcional)"
                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-violet-500 resize-none" />
              <button type="submit" disabled={ctxPending}
                className="bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors whitespace-nowrap">
                {ctxPending ? '...' : 'Guardar'}
              </button>
            </div>
            {ctxState?.success && <p className="text-emerald-400 text-xs">Contexto guardado</p>}
          </form>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-4">
            <div className="w-16 h-16 rounded-full bg-violet-600/20 flex items-center justify-center text-3xl">🤖</div>
            <div>
              <p className="text-white font-semibold">Hola, soy VAYNEX</p>
              <p className="text-slate-400 text-sm mt-1">Tu staff de IA. Pregúntame sobre el equipo,<br />planificación, rivales o cualquier cosa táctica.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 w-full max-w-md">
              {[
                '¿Qué debería trabajar esta semana antes del próximo partido?',
                'Dame un resumen del estado del equipo',
                'Ayúdame a planificar el entrenamiento de mañana',
                '¿Qué aspectos tácticos debo reforzar?',
              ].map(suggestion => (
                <button key={suggestion} onClick={() => setInput(suggestion)}
                  className="text-left text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-lg transition-colors border border-slate-700">
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-1">VX</div>
            )}
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
              msg.role === 'user'
                ? 'bg-emerald-600 text-white rounded-br-sm'
                : 'bg-slate-800 text-slate-100 rounded-bl-sm'
            }`}>
              {msg.content || (loading && i === messages.length - 1 ? (
                <span className="flex gap-1">
                  <span className="animate-bounce">·</span>
                  <span className="animate-bounce delay-100">·</span>
                  <span className="animate-bounce delay-200">·</span>
                </span>
              ) : '')}
            </div>
          </div>
        ))}

        {loading && messages[messages.length - 1]?.role !== 'assistant' && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">VX</div>
            <div className="bg-slate-800 rounded-2xl rounded-bl-sm px-4 py-3">
              <span className="flex gap-1 text-slate-400">
                <span className="animate-bounce">·</span>
                <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>·</span>
                <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>·</span>
              </span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-slate-800">
        <div className="flex gap-3 items-end">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe a VAYNEX... (Enter para enviar, Shift+Enter para nueva línea)"
            rows={1}
            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors resize-none text-sm"
            style={{ maxHeight: '120px' }}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white p-3 rounded-xl transition-colors flex-shrink-0"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  )
}

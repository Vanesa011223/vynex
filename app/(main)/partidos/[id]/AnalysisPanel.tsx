'use client'
import { useActionState } from 'react'
import { saveMatchNotes, generateAIAnalysis } from '@/app/actions/analysis'

type Props = {
  matchId: string
  initialNotes: string
  initialAiAnalysis: string
}

export default function AnalysisPanel({ matchId, initialNotes, initialAiAnalysis }: Props) {
  const [notesState, notesAction, notesPending] = useActionState(saveMatchNotes, undefined)
  const [aiState, aiAction, aiPending] = useActionState(generateAIAnalysis, undefined)

  const currentAi = aiState?.analysis ?? initialAiAnalysis

  return (
    <div className="space-y-4">
      {/* Manual notes */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-800">
          <h2 className="font-semibold text-white">📝 Notas del partido</h2>
          <p className="text-xs text-slate-500 mt-0.5">Táctica, observaciones, aspectos a mejorar</p>
        </div>
        <form action={notesAction} className="p-4 space-y-3">
          <input type="hidden" name="matchId" value={matchId} />
          <textarea
            name="notes"
            defaultValue={initialNotes}
            rows={5}
            placeholder="Escribe tus notas sobre el partido: qué funcionó, qué mejorar, táctica utilizada, rendimiento del equipo..."
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors resize-none text-sm"
          />
          <div className="flex items-center justify-between">
            <div>
              {notesState?.success && <span className="text-emerald-400 text-sm">Guardado</span>}
              {notesState?.error && <span className="text-red-400 text-sm">{notesState.error}</span>}
            </div>
            <button
              type="submit"
              disabled={notesPending}
              className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              {notesPending ? 'Guardando...' : 'Guardar notas'}
            </button>
          </div>
        </form>
      </div>

      {/* AI Analysis */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-800">
          <h2 className="font-semibold text-white">🤖 Análisis con IA</h2>
          <p className="text-xs text-slate-500 mt-0.5">Describe el partido y la IA te dará feedback táctico</p>
        </div>
        <form action={aiAction} className="p-4 space-y-3">
          <input type="hidden" name="matchId" value={matchId} />
          <textarea
            name="prompt"
            rows={3}
            placeholder="Ej: El equipo tuvo problemas en la presión alta, perdimos muchos balones en el mediocampo y el lateral izquierdo no llegó bien a las coberturas..."
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors resize-none text-sm"
          />
          <div className="flex items-center justify-between">
            <div>
              {aiState?.error && <span className="text-red-400 text-sm">{aiState.error}</span>}
            </div>
            <button
              type="submit"
              disabled={aiPending}
              className="bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              {aiPending ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Analizando...
                </>
              ) : 'Analizar con IA'}
            </button>
          </div>
        </form>

        {currentAi && (
          <div className="px-4 pb-4">
            <div className="bg-slate-800 rounded-xl p-4 border border-violet-500/20">
              <p className="text-xs text-violet-400 font-medium mb-2">Análisis táctico</p>
              <div className="text-slate-200 text-sm whitespace-pre-wrap leading-relaxed">{currentAi}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

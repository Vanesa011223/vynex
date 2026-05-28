'use client'
import { useActionState, useState, useRef } from 'react'
import { updateRivalSwot, deleteRival } from '@/app/actions/rivales'
import { useRouter } from 'next/navigation'
import { TrendingUp, TrendingDown, Shield, AlertTriangle, Brain, Trash2, Save } from 'lucide-react'

type Rival = {
  id: string
  name: string
  competition: string | null
  strengths: string | null
  weaknesses: string | null
  opportunities: string | null
  threats: string | null
  notes: string | null
  aiAnalysis: string | null
}

const SWOT_FIELDS = [
  { key: 'strengths', label: 'Fortalezas', icon: TrendingUp, color: 'emerald', desc: 'Qué hacen bien, sus virtudes tácticas' },
  { key: 'weaknesses', label: 'Debilidades', icon: TrendingDown, color: 'red', desc: 'Puntos flojos, errores frecuentes' },
  { key: 'opportunities', label: 'Oportunidades', icon: Shield, color: 'blue', desc: 'Cómo podemos atacar sus debilidades' },
  { key: 'threats', label: 'Amenazas', icon: AlertTriangle, color: 'yellow', desc: 'Qué nos puede hacer daño' },
] as const

const colorMap = {
  emerald: 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400',
  red: 'border-red-500/30 bg-red-500/5 text-red-400',
  blue: 'border-blue-500/30 bg-blue-500/5 text-blue-400',
  yellow: 'border-yellow-500/30 bg-yellow-500/5 text-yellow-400',
}

export default function RivalDetail({ rival }: { rival: Rival }) {
  const router = useRouter()
  const [swotState, swotAction, swotPending] = useActionState(updateRivalSwot, undefined)
  const [deleteState, deleteAction, deletePending] = useActionState(deleteRival, undefined)
  const [aiText, setAiText] = useState(rival.aiAnalysis ?? '')
  const [aiLoading, setAiLoading] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  async function generateAI() {
    setAiLoading(true)
    setAiText('')
    try {
      const res = await fetch('/api/rival-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rivalId: rival.id }),
      })
      if (!res.ok) throw new Error('Error generando análisis')
      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let done = false
      while (!done) {
        const { value, done: d } = await reader.read()
        done = d
        if (value) setAiText(prev => prev + decoder.decode(value))
      }
    } catch {
      setAiText('Error al generar el análisis. Comprueba que tienes configurada la API key de Anthropic.')
    } finally {
      setAiLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">{rival.name}</h1>
            {rival.competition && <p className="text-slate-400 text-sm mt-1">{rival.competition}</p>}
          </div>
          <div className="flex items-center gap-2">
            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-1.5 text-slate-500 hover:text-red-400 text-sm transition-colors"
              >
                <Trash2 size={15} /> Eliminar
              </button>
            ) : (
              <form action={async (fd) => { await deleteAction(fd); router.push('/rivales') }} className="flex items-center gap-2">
                <input type="hidden" name="id" value={rival.id} />
                <span className="text-sm text-red-400">¿Confirmar?</span>
                <button type="submit" disabled={deletePending} className="text-sm text-red-400 hover:text-red-300 font-medium">Sí, eliminar</button>
                <button type="button" onClick={() => setConfirmDelete(false)} className="text-sm text-slate-400 hover:text-white">Cancelar</button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* SWOT form */}
      <form action={swotAction} className="space-y-4">
        <input type="hidden" name="id" value={rival.id} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SWOT_FIELDS.map(({ key, label, icon: Icon, color, desc }) => (
            <div key={key} className={`border rounded-2xl p-4 ${colorMap[color]}`}>
              <div className="flex items-center gap-2 mb-1">
                <Icon size={16} />
                <span className="font-semibold text-sm">{label}</span>
              </div>
              <p className="text-xs text-slate-500 mb-2">{desc}</p>
              <textarea
                name={key}
                defaultValue={rival[key as keyof Rival] as string ?? ''}
                rows={4}
                placeholder={`Escribe aquí las ${label.toLowerCase()}...`}
                className="w-full bg-slate-900/60 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm resize-none focus:outline-none focus:border-slate-500"
              />
            </div>
          ))}
        </div>

        <div>
          <label className="text-xs text-slate-400 mb-1 block">Notas adicionales del cuerpo técnico</label>
          <textarea
            name="notes"
            defaultValue={rival.notes ?? ''}
            rows={3}
            placeholder="Otras observaciones, jugadoras clave del rival, sistema de juego habitual..."
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm resize-none focus:outline-none focus:border-slate-500"
          />
        </div>

        {swotState?.error && <p className="text-red-400 text-sm">{swotState.error}</p>}
        {swotState?.success && <p className="text-emerald-400 text-sm">DAFO guardado correctamente</p>}

        <button
          type="submit"
          disabled={swotPending}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
        >
          <Save size={15} /> {swotPending ? 'Guardando...' : 'Guardar DAFO'}
        </button>
      </form>

      {/* AI Analysis */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain size={18} className="text-violet-400" />
            <h2 className="font-semibold text-white">Análisis Táctico IA</h2>
          </div>
          <button
            onClick={generateAI}
            disabled={aiLoading}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Brain size={14} />
            {aiLoading ? 'Analizando...' : aiText ? 'Regenerar análisis' : 'Generar análisis IA'}
          </button>
        </div>

        {aiText ? (
          <div className="prose prose-invert prose-sm max-w-none">
            <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{aiText}</div>
          </div>
        ) : (
          <p className="text-slate-500 text-sm italic">
            {aiLoading ? 'VAYNEX está analizando al rival...' : 'Rellena el DAFO y pulsa "Generar análisis IA" para obtener un plan táctico completo.'}
          </p>
        )}
      </div>
    </div>
  )
}

'use client'
import { useActionState, useState, useEffect } from 'react'
import { createTrainingPlan, addTrainingSession, deleteTrainingSession } from '@/app/actions/entrenamientos'
import { Plus, Brain, Dumbbell, Trash2, ChevronDown } from 'lucide-react'

type Session = {
  id: string
  planId: string
  dayOfWeek: number
  title: string
  sessionType: string
  duration: number | null
  notes: string | null
}

type Plan = {
  id: string
  weekStart: string
  objectives: string | null
  aiPlan: string | null
  sessions: Session[]
}

const DAYS = [
  { n: 1, label: 'Lunes' },
  { n: 2, label: 'Martes' },
  { n: 3, label: 'Miércoles' },
  { n: 4, label: 'Jueves' },
  { n: 5, label: 'Viernes' },
  { n: 6, label: 'Sábado' },
]

const SESSION_TYPES = [
  { value: 'fisico', label: 'Físico', color: 'bg-orange-500/20 text-orange-400' },
  { value: 'tecnico', label: 'Técnico', color: 'bg-blue-500/20 text-blue-400' },
  { value: 'tactico', label: 'Táctico', color: 'bg-violet-500/20 text-violet-400' },
  { value: 'partido', label: 'Partido', color: 'bg-emerald-500/20 text-emerald-400' },
  { value: 'recuperacion', label: 'Recuperación', color: 'bg-slate-500/20 text-slate-300' },
  { value: 'libre', label: 'Libre', color: 'bg-slate-700/50 text-slate-400' },
]

function sessionTypeStyle(type: string) {
  return SESSION_TYPES.find(s => s.value === type)?.color ?? 'bg-slate-700/50 text-slate-400'
}
function sessionTypeLabel(type: string) {
  return SESSION_TYPES.find(s => s.value === type)?.label ?? type
}

function weekLabel(iso: string) {
  const d = new Date(iso)
  const end = new Date(d.getTime() + 5 * 24 * 60 * 60 * 1000)
  return `Semana del ${d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })} al ${end.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}`
}

function getMondayISO() {
  const d = new Date()
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d.toISOString().split('T')[0]
}

export default function EntrenamientosClient({
  plans,
  activePlanId,
}: {
  plans: Plan[]
  activePlanId: string | null
}) {
  const [selectedPlanId, setSelectedPlanId] = useState(activePlanId)
  const [localPlans, setLocalPlans] = useState(plans)
  const activePlan = localPlans.find(p => p.id === selectedPlanId)

  const [showNewPlan, setShowNewPlan] = useState(false)
  const [newPlanState, newPlanAction, newPlanPending] = useActionState<
    { error?: string; success?: boolean; id?: string } | undefined,
    FormData
  >(createTrainingPlan, undefined)

  const [addSessionDay, setAddSessionDay] = useState<number | null>(null)
  const [sessionState, sessionAction, sessionPending] = useActionState(addTrainingSession, undefined)
  const [delState, delAction] = useActionState(deleteTrainingSession, undefined)

  const [aiText, setAiText] = useState(activePlan?.aiPlan ?? '')
  const [aiLoading, setAiLoading] = useState(false)
  const [showAiPlan, setShowAiPlan] = useState(false)

  useEffect(() => {
    if (newPlanState?.success) {
      setShowNewPlan(false)
      window.location.reload()
    }
  }, [newPlanState])

  async function generateAIPlan() {
    if (!activePlan) return
    setAiLoading(true)
    setAiText('')
    setShowAiPlan(true)
    try {
      const res = await fetch('/api/training-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: activePlan.id }),
      })
      if (!res.ok) throw new Error('Error')
      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let done = false
      while (!done) {
        const { value, done: d } = await reader.read()
        done = d
        if (value) setAiText(prev => prev + decoder.decode(value))
      }
    } catch {
      setAiText('Error al generar el plan. Verifica que tienes configurada la API key de Anthropic.')
    } finally {
      setAiLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Plan selector */}
      <div className="flex flex-wrap items-center gap-3">
        {localPlans.map(p => (
          <button
            key={p.id}
            onClick={() => { setSelectedPlanId(p.id); setAiText(p.aiPlan ?? ''); setShowAiPlan(false) }}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              p.id === selectedPlanId
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {weekLabel(p.weekStart)}
          </button>
        ))}
        <button
          onClick={() => setShowNewPlan(!showNewPlan)}
          className="flex items-center gap-1.5 text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
        >
          <Plus size={15} /> Nueva semana
        </button>
      </div>

      {/* New plan form */}
      {showNewPlan && (
        <form
          action={newPlanAction}
          className="bg-slate-900 border border-slate-700 rounded-2xl p-4 space-y-3"
        >
          <h3 className="font-semibold text-white text-sm">Nueva semana de entrenamiento</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Inicio de semana (lunes) *</label>
              <input
                name="weekStart"
                type="date"
                defaultValue={getMondayISO()}
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Objetivos de la semana</label>
              <input
                name="objectives"
                placeholder="ej. Trabajar pressing alto, penalti..."
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
          {newPlanState?.error && <p className="text-red-400 text-sm">{newPlanState.error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={newPlanPending} className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              {newPlanPending ? 'Creando...' : 'Crear semana'}
            </button>
            <button type="button" onClick={() => setShowNewPlan(false)} className="text-slate-400 hover:text-white px-4 py-2 rounded-lg text-sm transition-colors">
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Active plan */}
      {activePlan ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-white">{weekLabel(activePlan.weekStart)}</h2>
              {activePlan.objectives && (
                <p className="text-sm text-slate-400 mt-0.5">Objetivos: {activePlan.objectives}</p>
              )}
            </div>
            <button
              onClick={generateAIPlan}
              disabled={aiLoading}
              className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <Brain size={14} />
              {aiLoading ? 'Generando...' : 'Plan IA'}
            </button>
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {DAYS.map(({ n, label }) => {
              const daySessions = activePlan.sessions.filter(s => s.dayOfWeek === n)
              const isAdding = addSessionDay === n

              return (
                <div key={n} className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-white text-sm">{label}</span>
                    <button
                      onClick={() => setAddSessionDay(isAdding ? null : n)}
                      className="text-slate-500 hover:text-emerald-400 transition-colors"
                    >
                      <Plus size={16} />
                    </button>
                  </div>

                  {daySessions.map(s => (
                    <div key={s.id} className="bg-slate-800 rounded-lg p-2.5 space-y-1">
                      <div className="flex items-start justify-between gap-1">
                        <span className="text-sm text-white font-medium leading-tight">{s.title}</span>
                        <form action={delAction}>
                          <input type="hidden" name="id" value={s.id} />
                          <button type="submit" className="text-slate-600 hover:text-red-400 transition-colors shrink-0">
                            <Trash2 size={13} />
                          </button>
                        </form>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-1.5 py-0.5 rounded ${sessionTypeStyle(s.sessionType)}`}>
                          {sessionTypeLabel(s.sessionType)}
                        </span>
                        {s.duration && <span className="text-xs text-slate-500">{s.duration}min</span>}
                      </div>
                      {s.notes && <p className="text-xs text-slate-400">{s.notes}</p>}
                    </div>
                  ))}

                  {daySessions.length === 0 && !isAdding && (
                    <p className="text-xs text-slate-600 italic">Sin sesión</p>
                  )}

                  {isAdding && (
                    <form
                      action={async (fd) => { await sessionAction(fd); setAddSessionDay(null) }}
                      className="space-y-2 border border-slate-700 rounded-lg p-2 bg-slate-800/50"
                    >
                      <input type="hidden" name="planId" value={activePlan.id} />
                      <input type="hidden" name="dayOfWeek" value={n} />
                      <input
                        name="title"
                        required
                        placeholder="Nombre de la sesión"
                        autoFocus
                        className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-white text-xs focus:outline-none focus:border-emerald-500"
                      />
                      <div className="grid grid-cols-2 gap-1.5">
                        <select name="sessionType" required className="bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-white text-xs focus:outline-none focus:border-emerald-500">
                          <option value="">Tipo</option>
                          {SESSION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                        <input
                          name="duration"
                          type="number"
                          placeholder="Min"
                          min="15"
                          max="180"
                          className="bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-white text-xs focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <input
                        name="notes"
                        placeholder="Notas opcionales"
                        className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-white text-xs focus:outline-none focus:border-emerald-500"
                      />
                      {sessionState?.error && <p className="text-red-400 text-xs">{sessionState.error}</p>}
                      <div className="flex gap-1.5">
                        <button type="submit" disabled={sessionPending} className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-2.5 py-1 rounded text-xs font-medium transition-colors">
                          {sessionPending ? '...' : 'Añadir'}
                        </button>
                        <button type="button" onClick={() => setAddSessionDay(null)} className="text-slate-400 hover:text-white px-2 py-1 rounded text-xs transition-colors">
                          ✕
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )
            })}
          </div>

          {/* AI Plan output */}
          {showAiPlan && (
            <div className="bg-slate-900 border border-violet-500/20 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Brain size={18} className="text-violet-400" />
                <h3 className="font-semibold text-white">Plan IA para esta semana</h3>
              </div>
              {aiText ? (
                <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{aiText}</div>
              ) : (
                <p className="text-slate-500 text-sm italic">Generando plan de entrenamiento...</p>
              )}
            </div>
          )}

          {!showAiPlan && activePlan.aiPlan && (
            <button
              onClick={() => { setAiText(activePlan.aiPlan!); setShowAiPlan(true) }}
              className="flex items-center gap-2 text-sm text-violet-400 hover:text-violet-300 transition-colors"
            >
              <ChevronDown size={16} /> Ver plan IA guardado
            </button>
          )}
        </div>
      ) : (
        <div className="text-center py-16 text-slate-500">
          <Dumbbell size={40} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium">Sin semanas planificadas</p>
          <p className="text-sm mt-1">Crea una nueva semana para empezar</p>
        </div>
      )}
    </div>
  )
}

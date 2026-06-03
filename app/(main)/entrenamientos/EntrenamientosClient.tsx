'use client'
import { useActionState, useState, useEffect } from 'react'
import {
  createTrainingPlan, addTrainingSession, updateTrainingSession,
  deleteTrainingSession, updateTrainingPlanObjectives,
  addExerciseToSession, removeExerciseFromSession,
} from '@/app/actions/entrenamientos'
import { Plus, Brain, Dumbbell, Trash2, ChevronDown, Pencil, X, BookOpen, Check } from 'lucide-react'

type SessionExercise = {
  id: string
  exerciseId: string
  name: string
  category: string
  duration: number | null
  difficulty: string | null
  notes: string | null
}

type Session = {
  id: string
  planId: string
  dayOfWeek: number
  title: string
  sessionType: string
  duration: number | null
  notes: string | null
  exercises: SessionExercise[]
}

type Plan = {
  id: string
  weekStart: string
  objectives: string | null
  aiPlan: string | null
  sessions: Session[]
}

type Exercise = {
  id: string
  name: string
  category: string
  description: string | null
  objectives: string | null
  duration: number | null
  difficulty: string | null
  materials: string | null
  sessionCount: number
}

const DAYS = [
  { n: 1, label: 'Lunes' }, { n: 2, label: 'Martes' }, { n: 3, label: 'Miércoles' },
  { n: 4, label: 'Jueves' }, { n: 5, label: 'Viernes' }, { n: 6, label: 'Sábado' },
]

const SESSION_TYPES = [
  { value: 'fisico',       label: 'Físico',        color: 'bg-orange-500/20 text-orange-400',  cat: 'fisico' },
  { value: 'tecnico',      label: 'Técnico',       color: 'bg-blue-500/20 text-blue-400',      cat: 'tecnico' },
  { value: 'tactico',      label: 'Táctico',       color: 'bg-violet-500/20 text-violet-400',  cat: 'tactico' },
  { value: 'partido',      label: 'Partido',       color: 'bg-emerald-500/20 text-emerald-400',cat: null },
  { value: 'recuperacion', label: 'Recuperación',  color: 'bg-slate-500/20 text-slate-300',    cat: 'recuperacion' },
  { value: 'libre',        label: 'Libre',         color: 'bg-slate-700/50 text-slate-400',    cat: null },
]

const DIFFICULTY_COLORS: Record<string, string> = { facil: 'text-emerald-400', medio: 'text-yellow-400', dificil: 'text-red-400' }
const DIFFICULTY_LABELS: Record<string, string> = { facil: 'Fácil', medio: 'Medio', dificil: 'Difícil' }

function typeStyle(type: string) { return SESSION_TYPES.find(s => s.value === type)?.color ?? 'bg-slate-700/50 text-slate-400' }
function typeLabel(type: string) { return SESSION_TYPES.find(s => s.value === type)?.label ?? type }
function typeCategory(type: string) { return SESSION_TYPES.find(s => s.value === type)?.cat ?? null }

function weekLabel(iso: string) {
  const d = new Date(iso)
  const end = new Date(d.getTime() + 5 * 24 * 60 * 60 * 1000)
  return `Semana del ${d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })} al ${end.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}`
}

function getMondayISO() {
  const d = new Date()
  const diff = d.getDay() === 0 ? -6 : 1 - d.getDay()
  d.setDate(d.getDate() + diff)
  return d.toISOString().split('T')[0]
}

export default function EntrenamientosClient({
  plans, exercises, activePlanId,
}: {
  plans: Plan[]
  exercises: Exercise[]
  activePlanId: string | null
}) {
  const [selectedPlanId, setSelectedPlanId] = useState(activePlanId)
  const activePlan = plans.find(p => p.id === selectedPlanId)

  const [showNewPlan, setShowNewPlan] = useState(false)
  const [newPlanState, newPlanAction, newPlanPending] = useActionState<
    { error?: string; success?: boolean; id?: string } | undefined, FormData
  >(createTrainingPlan, undefined)

  const [objState, objAction, objPending] = useActionState(updateTrainingPlanObjectives, undefined)
  const [editingObj, setEditingObj] = useState(false)

  const [addSessionDay, setAddSessionDay] = useState<number | null>(null)
  const [sessionState, sessionAction, sessionPending] = useActionState(addTrainingSession, undefined)
  const [delState, delAction] = useActionState(deleteTrainingSession, undefined)
  const [editingSession, setEditingSession] = useState<string | null>(null)
  const [editState, editAction, editPending] = useActionState(updateTrainingSession, undefined)

  const [pickingExerciseFor, setPickingExerciseFor] = useState<string | null>(null)
  const [addExState, addExAction] = useActionState(addExerciseToSession, undefined)
  const [removeExState, removeExAction] = useActionState(removeExerciseFromSession, undefined)
  const [exerciseFilter, setExerciseFilter] = useState('')

  const [aiText, setAiText] = useState(activePlan?.aiPlan ?? '')
  const [aiLoading, setAiLoading] = useState(false)
  const [showAiPlan, setShowAiPlan] = useState(false)

  useEffect(() => {
    if (newPlanState?.success) { setShowNewPlan(false); window.location.reload() }
  }, [newPlanState])

  useEffect(() => {
    if (editState?.success) setEditingSession(null)
  }, [editState])

  async function generateAIPlan() {
    if (!activePlan) return
    setAiLoading(true); setAiText(''); setShowAiPlan(true)
    try {
      const res = await fetch('/api/training-ai', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: activePlan.id }),
      })
      if (!res.ok) throw new Error()
      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let done = false
      while (!done) {
        const { value, done: d } = await reader.read()
        done = d
        if (value) setAiText(prev => prev + decoder.decode(value))
      }
    } catch { setAiText('Error al generar el plan. Verifica la API key de Anthropic.') }
    finally { setAiLoading(false) }
  }

  const pickerSession = pickingExerciseFor ? activePlan?.sessions.find(s => s.id === pickingExerciseFor) : null
  const pickerCat = pickerSession ? typeCategory(pickerSession.sessionType) : null
  const linkedIds = pickerSession ? new Set(pickerSession.exercises.map(e => e.exerciseId)) : new Set()
  const filteredExercises = exercises.filter(e => {
    const matchCat = !pickerCat || e.category === pickerCat
    const matchSearch = !exerciseFilter || e.name.toLowerCase().includes(exerciseFilter.toLowerCase())
    return matchCat && matchSearch
  })

  return (
    <div className="space-y-5">
      {/* Plan selector */}
      <div className="flex flex-wrap items-center gap-2">
        {plans.map(p => (
          <button key={p.id} onClick={() => { setSelectedPlanId(p.id); setAiText(p.aiPlan ?? ''); setShowAiPlan(false) }}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${p.id === selectedPlanId ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
            {weekLabel(p.weekStart)}
          </button>
        ))}
        <button onClick={() => setShowNewPlan(!showNewPlan)}
          className="flex items-center gap-1.5 text-sm text-emerald-400 hover:text-emerald-300 transition-colors">
          <Plus size={15} /> Nueva semana
        </button>
      </div>

      {/* New plan form */}
      {showNewPlan && (
        <form action={newPlanAction} className="bg-slate-900 border border-slate-700 rounded-2xl p-4 space-y-3">
          <h3 className="font-semibold text-white text-sm">Nueva semana</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Inicio de semana (lunes) *</label>
              <input name="weekStart" type="date" defaultValue={getMondayISO()} required
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Objetivos de la semana</label>
              <input name="objectives" placeholder="ej. Pressing alto, penalti..."
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500" />
            </div>
          </div>
          {newPlanState?.error && <p className="text-red-400 text-sm">{newPlanState.error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={newPlanPending}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              {newPlanPending ? 'Creando...' : 'Crear semana'}
            </button>
            <button type="button" onClick={() => setShowNewPlan(false)} className="text-slate-400 hover:text-white px-4 py-2 rounded-lg text-sm transition-colors">Cancelar</button>
          </div>
        </form>
      )}

      {activePlan ? (
        <div className="space-y-4">
          {/* Week header + objectives */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-white">{weekLabel(activePlan.weekStart)}</h2>
              <button onClick={generateAIPlan} disabled={aiLoading}
                className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors">
                <Brain size={14} />{aiLoading ? 'Generando...' : 'Plan IA'}
              </button>
            </div>

            {/* Editable objectives */}
            {editingObj ? (
              <form action={async (fd) => { await objAction(fd); setEditingObj(false) }} className="flex gap-2">
                <input type="hidden" name="planId" value={activePlan.id} />
                <input name="objectives" defaultValue={activePlan.objectives ?? ''} autoFocus placeholder="Objetivos de la semana..."
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500" />
                <button type="submit" disabled={objPending} className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 rounded-lg text-sm transition-colors">
                  {objPending ? '...' : <Check size={14} />}
                </button>
                <button type="button" onClick={() => setEditingObj(false)} className="text-slate-400 hover:text-white px-2 py-2 rounded-lg text-sm transition-colors"><X size={14} /></button>
              </form>
            ) : (
              <div className="flex items-center gap-2 group">
                <p className={`text-sm flex-1 ${activePlan.objectives ? 'text-slate-300' : 'text-slate-600 italic'}`}>
                  {activePlan.objectives || 'Sin objetivos definidos para esta semana'}
                </p>
                <button onClick={() => setEditingObj(true)} className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-white transition-all">
                  <Pencil size={14} />
                </button>
              </div>
            )}
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
                    <button onClick={() => setAddSessionDay(isAdding ? null : n)} className="text-slate-500 hover:text-emerald-400 transition-colors">
                      <Plus size={16} />
                    </button>
                  </div>

                  {daySessions.map(s => (
                    <div key={s.id} className="bg-slate-800 rounded-lg overflow-hidden">
                      {editingSession === s.id ? (
                        <form action={async (fd) => { await editAction(fd) }} className="p-2 space-y-1.5">
                          <input type="hidden" name="id" value={s.id} />
                          <input name="title" defaultValue={s.title} required autoFocus
                            className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-xs focus:outline-none focus:border-emerald-500" />
                          <div className="grid grid-cols-2 gap-1">
                            <select name="sessionType" defaultValue={s.sessionType} className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-xs focus:outline-none focus:border-emerald-500">
                              {SESSION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                            </select>
                            <input name="duration" type="number" defaultValue={s.duration ?? ''} placeholder="Min"
                              className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-xs focus:outline-none focus:border-emerald-500" />
                          </div>
                          <input name="notes" defaultValue={s.notes ?? ''} placeholder="Notas"
                            className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-xs focus:outline-none focus:border-emerald-500" />
                          {editState?.error && <p className="text-red-400 text-xs">{editState.error}</p>}
                          <div className="flex gap-1">
                            <button type="submit" disabled={editPending} className="bg-emerald-600 hover:bg-emerald-500 text-white px-2 py-1 rounded text-xs">{editPending ? '...' : 'Guardar'}</button>
                            <button type="button" onClick={() => setEditingSession(null)} className="text-slate-400 hover:text-white px-2 py-1 rounded text-xs">✕</button>
                          </div>
                        </form>
                      ) : (
                        <div className="p-2.5">
                          <div className="flex items-start justify-between gap-1">
                            <span className="text-sm text-white font-medium leading-tight flex-1">{s.title}</span>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <button onClick={() => setEditingSession(s.id)} className="text-slate-600 hover:text-blue-400 transition-colors">
                                <Pencil size={12} />
                              </button>
                              <form action={delAction} className="inline">
                                <input type="hidden" name="id" value={s.id} />
                                <button type="submit" className="text-slate-600 hover:text-red-400 transition-colors"><Trash2 size={12} /></button>
                              </form>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-xs px-1.5 py-0.5 rounded ${typeStyle(s.sessionType)}`}>{typeLabel(s.sessionType)}</span>
                            {s.duration && <span className="text-xs text-slate-500">{s.duration}min</span>}
                          </div>
                          {s.notes && <p className="text-xs text-slate-400 mt-1">{s.notes}</p>}

                          {/* Linked exercises */}
                          {s.exercises.length > 0 && (
                            <div className="mt-2 space-y-1 border-t border-slate-700 pt-2">
                              {s.exercises.map(e => (
                                <div key={e.id} className="flex items-center gap-1.5 text-xs">
                                  <span className="text-slate-300 flex-1 truncate">{e.name}</span>
                                  {e.duration && <span className="text-slate-500">{e.duration}m</span>}
                                  <form action={removeExAction}>
                                    <input type="hidden" name="sessionId" value={s.id} />
                                    <input type="hidden" name="exerciseId" value={e.exerciseId} />
                                    <button type="submit" className="text-slate-600 hover:text-red-400 transition-colors"><X size={11} /></button>
                                  </form>
                                </div>
                              ))}
                            </div>
                          )}

                          <button onClick={() => { setPickingExerciseFor(s.id); setExerciseFilter('') }}
                            className="mt-2 flex items-center gap-1 text-xs text-emerald-400/70 hover:text-emerald-400 transition-colors">
                            <BookOpen size={12} /> + Añadir ejercicio
                          </button>
                        </div>
                      )}
                    </div>
                  ))}

                  {daySessions.length === 0 && !isAdding && (
                    <p className="text-xs text-slate-600 italic">Sin sesión</p>
                  )}

                  {isAdding && (
                    <form action={async (fd) => { await sessionAction(fd); setAddSessionDay(null) }}
                      className="space-y-2 border border-slate-700 rounded-lg p-2 bg-slate-800/50">
                      <input type="hidden" name="planId" value={activePlan.id} />
                      <input type="hidden" name="dayOfWeek" value={n} />
                      <input name="title" required placeholder="Nombre de la sesión" autoFocus
                        className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-white text-xs focus:outline-none focus:border-emerald-500" />
                      <div className="grid grid-cols-2 gap-1.5">
                        <select name="sessionType" required className="bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-white text-xs focus:outline-none focus:border-emerald-500">
                          <option value="">Tipo</option>
                          {SESSION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                        <input name="duration" type="number" placeholder="Min" min="15" max="180"
                          className="bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-white text-xs focus:outline-none focus:border-emerald-500" />
                      </div>
                      <input name="notes" placeholder="Notas opcionales"
                        className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-white text-xs focus:outline-none focus:border-emerald-500" />
                      {sessionState?.error && <p className="text-red-400 text-xs">{sessionState.error}</p>}
                      <div className="flex gap-1.5">
                        <button type="submit" disabled={sessionPending} className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-2.5 py-1 rounded text-xs font-medium transition-colors">
                          {sessionPending ? '...' : 'Añadir'}
                        </button>
                        <button type="button" onClick={() => setAddSessionDay(null)} className="text-slate-400 hover:text-white px-2 py-1 rounded text-xs transition-colors">✕</button>
                      </div>
                    </form>
                  )}
                </div>
              )
            })}
          </div>

          {/* AI Plan */}
          {showAiPlan && (
            <div className="bg-slate-900 border border-violet-500/20 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Brain size={18} className="text-violet-400" />
                <h3 className="font-semibold text-white">Plan IA para esta semana</h3>
              </div>
              {aiText ? (
                <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{aiText}</div>
              ) : (
                <p className="text-slate-500 text-sm italic">Generando plan...</p>
              )}
            </div>
          )}

          {!showAiPlan && activePlan.aiPlan && (
            <button onClick={() => { setAiText(activePlan.aiPlan!); setShowAiPlan(true) }}
              className="flex items-center gap-2 text-sm text-violet-400 hover:text-violet-300 transition-colors">
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

      {/* Exercise picker modal */}
      {pickingExerciseFor && pickerSession && (
        <>
          <div className="fixed inset-0 bg-black/60 z-50" onClick={() => setPickingExerciseFor(null)} />
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-lg mx-auto bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-white text-sm">Añadir ejercicio a "{pickerSession.title}"</h3>
                {pickerCat && <p className="text-xs text-slate-400 mt-0.5">Mostrando ejercicios de: {pickerCat}</p>}
              </div>
              <button onClick={() => setPickingExerciseFor(null)} className="text-slate-400 hover:text-white"><X size={18} /></button>
            </div>
            <div className="p-3 border-b border-slate-800">
              <input value={exerciseFilter} onChange={e => setExerciseFilter(e.target.value)}
                placeholder="Buscar ejercicio..." autoFocus
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500" />
            </div>
            <div className="overflow-y-auto flex-1">
              {filteredExercises.length === 0 ? (
                <p className="text-center py-8 text-slate-500 text-sm">Sin ejercicios encontrados</p>
              ) : filteredExercises.map(e => {
                const linked = linkedIds.has(e.id)
                return (
                  <div key={e.id} className={`flex items-center gap-3 px-4 py-3 border-b border-slate-800 hover:bg-slate-800/50 transition-colors ${linked ? 'opacity-50' : ''}`}>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{e.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-slate-500">{e.category}</span>
                        {e.duration && <span className="text-xs text-slate-500">{e.duration}min</span>}
                        {e.difficulty && <span className={`text-xs ${DIFFICULTY_COLORS[e.difficulty] ?? ''}`}>{DIFFICULTY_LABELS[e.difficulty] ?? e.difficulty}</span>}
                      </div>
                      {e.objectives && <p className="text-xs text-slate-500 mt-0.5 truncate">{e.objectives}</p>}
                    </div>
                    {linked ? (
                      <span className="text-xs text-emerald-400 flex items-center gap-1 flex-shrink-0"><Check size={13} /> Añadido</span>
                    ) : (
                      <form action={async (fd) => { await addExAction(fd) }}>
                        <input type="hidden" name="sessionId" value={pickerSession.id} />
                        <input type="hidden" name="exerciseId" value={e.id} />
                        <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex-shrink-0">
                          Añadir
                        </button>
                      </form>
                    )}
                  </div>
                )
              })}
            </div>
            <div className="p-3 border-t border-slate-800">
              <button onClick={() => setPickingExerciseFor(null)}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white py-2 rounded-lg text-sm transition-colors">
                Cerrar
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

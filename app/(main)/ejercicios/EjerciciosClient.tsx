'use client'
import { useActionState, useState } from 'react'
import { addExercise, deleteExercise } from '@/app/actions/ejercicios'
import { Plus, BookOpen, Clock, Trash2, ChevronDown, ChevronUp } from 'lucide-react'

type Exercise = {
  id: string
  name: string
  category: string
  description: string | null
  objectives: string | null
  duration: number | null
  difficulty: string | null
  materials: string | null
  sessionCount?: number
}

const CATEGORIES = [
  { value: 'fisico', label: 'Físico', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  { value: 'tecnico', label: 'Técnico', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  { value: 'tactico', label: 'Táctico', color: 'bg-violet-500/20 text-violet-400 border-violet-500/30' },
  { value: 'porteras', label: 'Porteras', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  { value: 'calentamiento', label: 'Calentamiento', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  { value: 'recuperacion', label: 'Recuperación', color: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
]

const DIFFICULTIES = ['facil', 'medio', 'dificil']
const DIFFICULTY_LABELS: Record<string, string> = { facil: 'Fácil', medio: 'Medio', dificil: 'Difícil' }
const DIFFICULTY_COLORS: Record<string, string> = {
  facil: 'text-emerald-400',
  medio: 'text-yellow-400',
  dificil: 'text-red-400',
}

export default function EjerciciosClient({ exercises }: { exercises: Exercise[] }) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [addState, addAction, addPending] = useActionState(addExercise, undefined)
  const [delState, delAction] = useActionState(deleteExercise, undefined)

  const filtered = activeCategory ? exercises.filter(e => e.category === activeCategory) : exercises

  function getCategoryStyle(cat: string) {
    return CATEGORIES.find(c => c.value === cat)?.color ?? 'bg-slate-500/20 text-slate-400 border-slate-500/30'
  }
  function getCategoryLabel(cat: string) {
    return CATEGORIES.find(c => c.value === cat)?.label ?? cat
  }

  return (
    <div className="space-y-4">
      {/* Category filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveCategory(null)}
          className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
            activeCategory === null ? 'bg-white/10 text-white border-white/20' : 'text-slate-400 border-slate-700 hover:border-slate-500'
          }`}
        >
          Todos ({exercises.length})
        </button>
        {CATEGORIES.map(c => {
          const count = exercises.filter(e => e.category === c.value).length
          if (count === 0) return null
          return (
            <button
              key={c.value}
              onClick={() => setActiveCategory(c.value === activeCategory ? null : c.value)}
              className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                activeCategory === c.value ? c.color : 'text-slate-400 border-slate-700 hover:border-slate-500'
              }`}
            >
              {c.label} ({count})
            </button>
          )
        })}
      </div>

      {/* Add exercise button */}
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} /> Añadir Ejercicio
        </button>
      ) : (
        <form
          action={async (fd) => { await addAction(fd); setShowForm(false) }}
          className="bg-slate-900 border border-slate-700 rounded-2xl p-4 space-y-3"
        >
          <h3 className="font-semibold text-white">Nuevo ejercicio</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Nombre *</label>
              <input
                name="name"
                required
                placeholder="ej. Rondos 4vs1"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Categoría *</label>
              <select name="category" required className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500">
                <option value="">Selecciona categoría</option>
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="text-xs text-slate-400 mb-1 block">Descripción</label>
              <textarea
                name="description"
                rows={2}
                placeholder="Describe brevemente el ejercicio..."
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm resize-none focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs text-slate-400 mb-1 block">Objetivos</label>
              <input
                name="objectives"
                placeholder="ej. Mejorar presión alta, circulación rápida..."
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Duración (min)</label>
              <input
                name="duration"
                type="number"
                min="1"
                max="120"
                placeholder="15"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Dificultad</label>
              <select name="difficulty" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500">
                <option value="">Sin especificar</option>
                {DIFFICULTIES.map(d => <option key={d} value={d}>{DIFFICULTY_LABELS[d]}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="text-xs text-slate-400 mb-1 block">Materiales necesarios</label>
              <input
                name="materials"
                placeholder="ej. Conos, petos, balones..."
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
          {addState?.error && <p className="text-red-400 text-sm">{addState.error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={addPending} className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              {addPending ? 'Guardando...' : 'Guardar'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white px-4 py-2 rounded-lg text-sm transition-colors">
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Exercise list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <BookOpen size={40} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium">Sin ejercicios {activeCategory ? 'en esta categoría' : 'añadidos'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(e => (
            <div key={e.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <button
                onClick={() => setExpanded(expanded === e.id ? null : e.id)}
                className="w-full flex items-center gap-3 p-4 text-left hover:bg-slate-800/50 transition-colors"
              >
                <span className={`text-xs px-2 py-0.5 rounded-full border ${getCategoryStyle(e.category)}`}>
                  {getCategoryLabel(e.category)}
                </span>
                <span className="font-medium text-white flex-1">{e.name}</span>
                <div className="flex items-center gap-3 text-sm text-slate-400">
                  {e.duration && (
                    <span className="flex items-center gap-1">
                      <Clock size={13} /> {e.duration}min
                    </span>
                  )}
                  {(e.sessionCount ?? 0) > 0 && (
                    <span className="text-emerald-400/70 text-xs">✓ {e.sessionCount} sesión{(e.sessionCount ?? 0) !== 1 ? 'es' : ''}</span>
                  )}
                  {e.difficulty && (
                    <span className={DIFFICULTY_COLORS[e.difficulty] ?? ''}>{DIFFICULTY_LABELS[e.difficulty] ?? e.difficulty}</span>
                  )}
                  {expanded === e.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </button>

              {expanded === e.id && (
                <div className="px-4 pb-4 space-y-3 border-t border-slate-800 pt-3">
                  {e.objectives && (
                    <div>
                      <span className="text-xs text-slate-400 font-medium">Objetivos</span>
                      <p className="text-sm text-slate-300 mt-0.5">{e.objectives}</p>
                    </div>
                  )}
                  {e.description && (
                    <div>
                      <span className="text-xs text-slate-400 font-medium">Descripción</span>
                      <p className="text-sm text-slate-300 mt-0.5">{e.description}</p>
                    </div>
                  )}
                  {e.materials && (
                    <div>
                      <span className="text-xs text-slate-400 font-medium">Materiales</span>
                      <p className="text-sm text-slate-300 mt-0.5">{e.materials}</p>
                    </div>
                  )}
                  <form action={delAction} className="pt-1">
                    <input type="hidden" name="id" value={e.id} />
                    <button type="submit" className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-red-400 transition-colors">
                      <Trash2 size={13} /> Eliminar ejercicio
                    </button>
                  </form>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

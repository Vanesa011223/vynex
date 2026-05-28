'use client'
import { useActionState, useState } from 'react'
import { addRival } from '@/app/actions/rivales'
import Link from 'next/link'
import { Plus, Target, ChevronRight, Shield, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react'

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

export default function RivalesClient({ rivals }: { rivals: Rival[] }) {
  const [showForm, setShowForm] = useState(false)
  const [state, action, pending] = useActionState(addRival, undefined)

  const hasSwot = (r: Rival) => r.strengths || r.weaknesses || r.opportunities || r.threats

  return (
    <div className="space-y-4">
      {/* Add rival button */}
      <div>
        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={16} /> Añadir Rival
          </button>
        ) : (
          <form
            action={async (fd) => { await action(fd); setShowForm(false) }}
            className="bg-slate-900 border border-slate-700 rounded-2xl p-4 space-y-3"
          >
            <h3 className="font-semibold text-white">Nuevo rival</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Nombre del rival *</label>
                <input
                  name="name"
                  required
                  placeholder="ej. CD Rayo Femenino"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Competición</label>
                <input
                  name="competition"
                  placeholder="ej. Primera División Femenina"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
            {state?.error && <p className="text-red-400 text-sm">{state.error}</p>}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={pending}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                {pending ? 'Guardando...' : 'Guardar'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-slate-400 hover:text-white px-4 py-2 rounded-lg text-sm transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Rivals grid */}
      {rivals.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <Target size={40} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium">Sin rivales añadidos</p>
          <p className="text-sm mt-1">Añade un rival para empezar el análisis DAFO</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rivals.map(r => (
            <Link
              key={r.id}
              href={`/rivales/${r.id}`}
              className="bg-slate-900 border border-slate-800 hover:border-slate-600 rounded-2xl p-5 transition-all group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-white group-hover:text-emerald-400 transition-colors">{r.name}</h3>
                  {r.competition && <p className="text-xs text-slate-400 mt-0.5">{r.competition}</p>}
                </div>
                <ChevronRight size={18} className="text-slate-600 group-hover:text-slate-400 transition-colors mt-0.5" />
              </div>

              {hasSwot(r) ? (
                <div className="grid grid-cols-2 gap-2 mt-4">
                  <div className="bg-emerald-500/10 rounded-lg p-2">
                    <div className="flex items-center gap-1 text-emerald-400 text-xs font-medium mb-1">
                      <TrendingUp size={11} /> Fortalezas
                    </div>
                    <p className="text-xs text-slate-300 line-clamp-2">{r.strengths || '—'}</p>
                  </div>
                  <div className="bg-red-500/10 rounded-lg p-2">
                    <div className="flex items-center gap-1 text-red-400 text-xs font-medium mb-1">
                      <TrendingDown size={11} /> Debilidades
                    </div>
                    <p className="text-xs text-slate-300 line-clamp-2">{r.weaknesses || '—'}</p>
                  </div>
                  <div className="bg-blue-500/10 rounded-lg p-2">
                    <div className="flex items-center gap-1 text-blue-400 text-xs font-medium mb-1">
                      <Shield size={11} /> Oportunidades
                    </div>
                    <p className="text-xs text-slate-300 line-clamp-2">{r.opportunities || '—'}</p>
                  </div>
                  <div className="bg-yellow-500/10 rounded-lg p-2">
                    <div className="flex items-center gap-1 text-yellow-400 text-xs font-medium mb-1">
                      <AlertTriangle size={11} /> Amenazas
                    </div>
                    <p className="text-xs text-slate-300 line-clamp-2">{r.threats || '—'}</p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500 mt-3 italic">Sin análisis DAFO aún — haz clic para añadirlo</p>
              )}

              {r.aiAnalysis && (
                <div className="mt-3 flex items-center gap-1.5 text-xs text-violet-400">
                  <span className="w-1.5 h-1.5 bg-violet-400 rounded-full" />
                  Análisis IA disponible
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

'use client'
import { useActionState } from 'react'
import { updatePhysicalData } from '@/app/actions/players'

type Props = {
  userId: string
  height: number | null
  weight: number | null
  dominantFoot: string | null
  birthDate: Date | null
}

export default function PhysicalDataForm({ userId, height, weight, dominantFoot, birthDate }: Props) {
  const [state, action, pending] = useActionState(updatePhysicalData, undefined)

  return (
    <div className="bg-slate-900 rounded-2xl border border-amber-500/20 overflow-hidden">
      <div className="p-4 border-b border-slate-800 flex items-center gap-2">
        <span className="text-amber-400 text-sm font-medium">🔒 Datos físicos</span>
        <span className="text-xs text-slate-500">(solo visible para el cuerpo técnico)</span>
      </div>
      <form action={action} className="p-4 space-y-4">
        <input type="hidden" name="userId" value={userId} />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Altura (cm)</label>
            <input
              name="height"
              type="number"
              step="0.1"
              defaultValue={height ?? ''}
              placeholder="Ej: 165"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Peso (kg)</label>
            <input
              name="weight"
              type="number"
              step="0.1"
              defaultValue={weight ?? ''}
              placeholder="Ej: 60"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Pierna dominante</label>
            <select
              name="dominantFoot"
              defaultValue={dominantFoot ?? ''}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500"
            >
              <option value="">—</option>
              <option value="Derecha">Derecha</option>
              <option value="Izquierda">Izquierda</option>
              <option value="Ambidiestra">Ambidiestra</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Fecha de nacimiento</label>
            <input
              name="birthDate"
              type="date"
              defaultValue={birthDate ? birthDate.toISOString().split('T')[0] : ''}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div>
            {state?.success && <span className="text-emerald-400 text-sm">Guardado</span>}
            {state?.error && <span className="text-red-400 text-sm">{state.error}</span>}
          </div>
          <button
            type="submit"
            disabled={pending}
            className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            {pending ? 'Guardando...' : 'Guardar datos físicos'}
          </button>
        </div>
      </form>
    </div>
  )
}

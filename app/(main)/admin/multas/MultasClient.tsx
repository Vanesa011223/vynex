'use client'
import { useActionState, useState } from 'react'
import { addFine, toggleFinePaid, deleteFine } from '@/app/actions/fines'
import { Plus, Euro, CheckCircle, Circle, Trash2 } from 'lucide-react'

type Fine = {
  id: string
  playerId: string
  playerName: string
  reason: string
  amount: number
  paid: boolean
  date: string
  note: string | null
}

const REASONS = [
  'Tardanza al entrenamiento',
  'Tardanza al partido',
  'Móvil en el vestuario',
  'Falta de material',
  'Ausencia sin justificar',
  'Conducta inapropiada',
  'Otro',
]

export default function MultasClient({
  fines,
  players,
}: {
  fines: Fine[]
  players: { id: string; name: string }[]
}) {
  const [showForm, setShowForm] = useState(false)
  const [filterPaid, setFilterPaid] = useState<'all' | 'pending' | 'paid'>('all')
  const [addState, addAction, addPending] = useActionState(addFine, undefined)
  const [toggleState, toggleAction] = useActionState(toggleFinePaid, undefined)
  const [delState, delAction] = useActionState(deleteFine, undefined)

  const filtered = fines.filter(f =>
    filterPaid === 'all' ? true : filterPaid === 'pending' ? !f.paid : f.paid
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        {['all', 'pending', 'paid'].map(v => (
          <button key={v} onClick={() => setFilterPaid(v as any)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              filterPaid === v ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}>
            {v === 'all' ? `Todas (${fines.length})` : v === 'pending' ? `Pendientes (${fines.filter(f => !f.paid).length})` : `Pagadas (${fines.filter(f => f.paid).length})`}
          </button>
        ))}
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors ml-auto">
          <Plus size={16} /> Nueva multa
        </button>
      </div>

      {showForm && (
        <form action={async (fd) => { await addAction(fd); setShowForm(false) }}
          className="bg-slate-900 border border-slate-700 rounded-2xl p-4 space-y-3">
          <h3 className="font-semibold text-white">Nueva multa</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Jugadora *</label>
              <select name="playerId" required className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500">
                <option value="">Selecciona jugadora</option>
                {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Motivo *</label>
              <select name="reason" required className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500">
                <option value="">Selecciona motivo</option>
                {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Importe (€)</label>
              <input name="amount" type="number" min="0" step="0.5" placeholder="0.00"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Fecha</label>
              <input name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500" />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs text-slate-400 mb-1 block">Nota adicional</label>
              <input name="note" placeholder="Detalles opcionales..."
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500" />
            </div>
          </div>
          {addState?.error && <p className="text-red-400 text-sm">{addState.error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={addPending}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              {addPending ? 'Guardando...' : 'Añadir multa'}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="text-slate-400 hover:text-white px-4 py-2 rounded-lg text-sm transition-colors">
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Euro size={32} className="mx-auto mb-2 opacity-40" />
            <p>Sin multas {filterPaid !== 'all' ? 'en esta categoría' : 'registradas'}</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {filtered.map(f => (
              <div key={f.id} className="flex items-center gap-3 px-4 py-3">
                <form action={toggleAction}>
                  <input type="hidden" name="id" value={f.id} />
                  <input type="hidden" name="paid" value={String(f.paid)} />
                  <button type="submit" className={`transition-colors ${f.paid ? 'text-emerald-400' : 'text-slate-600 hover:text-emerald-400'}`}>
                    {f.paid ? <CheckCircle size={20} /> : <Circle size={20} />}
                  </button>
                </form>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-white text-sm font-medium">{f.playerName}</span>
                    <span className="text-slate-400 text-sm">— {f.reason}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-slate-500">
                      {new Date(f.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                    {f.note && <span className="text-xs text-slate-500">· {f.note}</span>}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className={`font-bold text-sm ${f.paid ? 'text-emerald-400 line-through opacity-60' : 'text-red-400'}`}>
                    {f.amount > 0 ? `${f.amount.toFixed(2)}€` : 'Sin importe'}
                  </span>
                  {f.paid && <p className="text-xs text-emerald-400/60">Pagada</p>}
                </div>
                <form action={delAction}>
                  <input type="hidden" name="id" value={f.id} />
                  <button type="submit" className="text-slate-600 hover:text-red-400 transition-colors p-1">
                    <Trash2 size={15} />
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

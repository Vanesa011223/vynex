'use client'
import { useActionState, useState } from 'react'
import { upsertConvocatoria } from '@/app/actions/convocatorias'
import { Users, CheckCircle, XCircle, AlertCircle, MinusCircle } from 'lucide-react'

type Player = { id: string; name: string; position: string | null }
type Conv = { playerId: string; status: string; note: string | null }

const STATUS_CONFIG = {
  convocada:      { label: 'Convocada',       icon: CheckCircle,  color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' },
  no_convocada:   { label: 'No convocada',    icon: MinusCircle,  color: 'text-slate-400',   bg: 'bg-slate-700/30 border-slate-600/30' },
  lesionada:      { label: 'Lesionada',       icon: AlertCircle,  color: 'text-yellow-400',  bg: 'bg-yellow-500/10 border-yellow-500/30' },
  sancionada:     { label: 'Sancionada',      icon: XCircle,      color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/30' },
}

export default function ConvocatoriaPanel({
  matchId,
  players,
  convocatorias,
}: {
  matchId: string
  players: Player[]
  convocatorias: Conv[]
}) {
  const [editing, setEditing] = useState<string | null>(null)
  const [state, action, pending] = useActionState(upsertConvocatoria, undefined)

  const getConv = (playerId: string) => convocatorias.find(c => c.playerId === playerId)

  const counts = {
    convocada: convocatorias.filter(c => c.status === 'convocada').length,
    no_convocada: convocatorias.filter(c => c.status === 'no_convocada').length,
    lesionada: convocatorias.filter(c => c.status === 'lesionada').length,
    sancionada: convocatorias.filter(c => c.status === 'sancionada').length,
  }

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users size={16} className="text-slate-400" />
          <h2 className="font-semibold text-white">Convocatoria</h2>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-emerald-400">{counts.convocada} conv.</span>
          {counts.lesionada > 0 && <span className="text-yellow-400">{counts.lesionada} lesión</span>}
          {counts.sancionada > 0 && <span className="text-red-400">{counts.sancionada} sanc.</span>}
        </div>
      </div>

      <div className="divide-y divide-slate-800">
        {players.map(p => {
          const conv = getConv(p.id)
          const cfg = conv ? STATUS_CONFIG[conv.status as keyof typeof STATUS_CONFIG] : null
          const Icon = cfg?.icon

          return (
            <div key={p.id} className="px-4 py-3">
              {editing === p.id ? (
                <form action={async (fd) => { await action(fd); setEditing(null) }} className="space-y-2">
                  <input type="hidden" name="matchId" value={matchId} />
                  <input type="hidden" name="playerId" value={p.id} />
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-white text-sm font-medium w-28 flex-shrink-0">{p.name.split(' ')[0]}</span>
                    <select name="status" defaultValue={conv?.status ?? 'convocada'}
                      className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:border-emerald-500 flex-1">
                      {Object.entries(STATUS_CONFIG).map(([v, c]) => (
                        <option key={v} value={v}>{c.label}</option>
                      ))}
                    </select>
                    <input name="note" defaultValue={conv?.note ?? ''} placeholder="Nota (opcional)"
                      className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:border-emerald-500 flex-1 min-w-24" />
                    <button type="submit" disabled={pending}
                      className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors">
                      {pending ? '...' : 'OK'}
                    </button>
                    <button type="button" onClick={() => setEditing(null)}
                      className="text-slate-400 hover:text-white px-2 py-1.5 rounded-lg text-xs transition-colors">✕</button>
                  </div>
                </form>
              ) : (
                <button onClick={() => setEditing(p.id)} className="w-full text-left flex items-center gap-3 hover:bg-slate-800/50 -mx-1 px-1 py-0.5 rounded-lg transition-colors">
                  {Icon && cfg ? (
                    <Icon size={16} className={cfg.color} />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-slate-600" />
                  )}
                  <div className="flex-1 min-w-0">
                    <span className="text-white text-sm">{p.name}</span>
                    {p.position && <span className="text-slate-500 text-xs ml-2">{p.position}</span>}
                    {conv?.note && <span className="text-slate-400 text-xs ml-2">— {conv.note}</span>}
                  </div>
                  {cfg && (
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color}`}>
                      {cfg.label}
                    </span>
                  )}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

'use client'
import { useActionState } from 'react'
import { upsertAttendance } from '@/app/actions/attendance'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle, Clock, MinusCircle } from 'lucide-react'

type Player = { id: string; name: string; position: string | null }
type AttRecord = { id: string; playerId: string; type: string; note: string | null }
type AttStat = { playerId: string; total: number; present: number; pct: number | null }

const TYPES = [
  { value: 'presente',   label: 'Presente',   icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/20 border-emerald-500/40' },
  { value: 'tarde',      label: 'Tarde',      icon: Clock,       color: 'text-yellow-400',  bg: 'bg-yellow-500/20 border-yellow-500/40' },
  { value: 'justificada',label: 'Justificada',icon: MinusCircle, color: 'text-blue-400',    bg: 'bg-blue-500/20 border-blue-500/40' },
  { value: 'ausente',    label: 'Ausente',    icon: XCircle,     color: 'text-red-400',     bg: 'bg-red-500/20 border-red-500/40' },
]

export default function AsistenciaClient({ players, attendance, selectedDate, attendanceStats }: {
  players: Player[]
  attendance: AttRecord[]
  selectedDate: string
  attendanceStats: AttStat[]
}) {
  const router = useRouter()
  const [state, action] = useActionState(upsertAttendance, undefined)

  const getRecord = (playerId: string) => attendance.find(a => a.playerId === playerId)
  const getStat = (playerId: string) => attendanceStats.find(s => s.playerId === playerId)

  const present = attendance.filter(a => a.type === 'presente' || a.type === 'tarde').length
  const absent = attendance.filter(a => a.type === 'ausente').length

  return (
    <div className="space-y-4">
      {/* Date picker */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-4">
        <div className="flex-1">
          <label className="text-xs text-slate-400 mb-1 block">Fecha del entrenamiento</label>
          <input type="date" value={selectedDate}
            onChange={e => router.push(`/admin/asistencia?date=${e.target.value}`)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500" />
        </div>
        <div className="flex gap-4 text-sm">
          <div className="text-center">
            <div className="text-emerald-400 font-bold text-xl">{present}</div>
            <div className="text-slate-500 text-xs">Presentes</div>
          </div>
          <div className="text-center">
            <div className="text-red-400 font-bold text-xl">{absent}</div>
            <div className="text-slate-500 text-xs">Ausentes</div>
          </div>
          <div className="text-center">
            <div className="text-slate-300 font-bold text-xl">{players.length - attendance.length}</div>
            <div className="text-slate-500 text-xs">Sin marcar</div>
          </div>
        </div>
      </div>

      {/* Player list */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="divide-y divide-slate-800">
          {players.map(p => {
            const record = getRecord(p.id)
            const stat = getStat(p.id)
            return (
              <div key={p.id} className="px-4 py-3">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex-1">
                    <span className="text-white text-sm font-medium">{p.name}</span>
                    {p.position && <span className="text-slate-500 text-xs ml-2">{p.position}</span>}
                    {stat?.pct !== null && stat?.total && stat.total > 0 && (
                      <span className={`text-xs ml-2 ${(stat.pct ?? 0) >= 80 ? 'text-emerald-400' : (stat.pct ?? 0) >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {stat.pct}% asist. ({stat.total} sesiones)
                      </span>
                    )}
                  </div>
                  {record && (
                    <span className={`text-xs px-2 py-0.5 rounded border ${TYPES.find(t => t.value === record.type)?.bg ?? 'bg-slate-800 border-slate-700'} ${TYPES.find(t => t.value === record.type)?.color ?? 'text-slate-400'}`}>
                      {TYPES.find(t => t.value === record.type)?.label ?? record.type}
                    </span>
                  )}
                </div>
                <div className="flex gap-2 flex-wrap">
                  {TYPES.map(t => {
                    const Icon = t.icon
                    const isActive = record?.type === t.value
                    return (
                      <form key={t.value} action={action}>
                        <input type="hidden" name="playerId" value={p.id} />
                        <input type="hidden" name="date" value={selectedDate} />
                        <input type="hidden" name="type" value={t.value} />
                        <button type="submit"
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs border transition-colors ${
                            isActive ? `${t.bg} ${t.color} font-medium` : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600 hover:text-white'
                          }`}>
                          <Icon size={13} /> {t.label}
                        </button>
                      </form>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

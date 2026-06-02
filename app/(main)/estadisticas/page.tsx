import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/dal'
import { calcRating, ratingColor, pct } from '@/lib/stats'
import Link from 'next/link'
import { Trophy, Star, Clock, Target, Shield, TrendingUp, ChevronRight } from 'lucide-react'

export default async function EstadisticasPage({
  searchParams,
}: {
  searchParams: Promise<{ jugadora?: string }>
}) {
  await verifySession()
  const { jugadora: selectedId } = await searchParams

  const [players, allStats, totalMatches] = await Promise.all([
    prisma.user.findMany({ where: { active: true, role: 'PLAYER' }, select: { id: true, name: true, position: true }, orderBy: { name: 'asc' } }),
    prisma.playerMatchStats.findMany({ where: { half: 'total' } }),
    prisma.match.count(),
  ])

  // ── Season aggregates per player ──
  const playerData = players.map(p => {
    const stats = allStats.filter(s => s.playerId === p.id)
    if (stats.length === 0) return null
    const totals = stats.reduce(
      (acc, s) => ({
        passesOk: acc.passesOk + s.passesOk, passesFail: acc.passesFail + s.passesFail,
        shotsOk: acc.shotsOk + s.shotsOk, shotsFail: acc.shotsFail + s.shotsFail,
        dribblesOk: acc.dribblesOk + s.dribblesOk, dribblesFail: acc.dribblesFail + s.dribblesFail,
        duelsOk: acc.duelsOk + s.duelsOk, duelsFail: acc.duelsFail + s.duelsFail,
        recovOk: acc.recovOk + s.recovOk, recovFail: acc.recovFail + s.recovFail,
        goals: acc.goals + s.goals, assists: acc.assists + s.assists, minutes: acc.minutes + s.minutes,
      }),
      { passesOk: 0, passesFail: 0, shotsOk: 0, shotsFail: 0, dribblesOk: 0, dribblesFail: 0, duelsOk: 0, duelsFail: 0, recovOk: 0, recovFail: 0, goals: 0, assists: 0, minutes: 0 }
    )
    const rating = calcRating(totals)
    const passAcc = pct(totals.passesOk, totals.passesFail)
    const recovAcc = pct(totals.recovOk, totals.recovFail)
    const matches = new Set(stats.map(s => s.matchId)).size
    return { ...p, ...totals, rating, passAcc, recovAcc, matches }
  }).filter(Boolean) as any[]

  const totalGoals = playerData.reduce((s, p) => s + p.goals, 0)
  const totalAssists = playerData.reduce((s, p) => s + p.assists, 0)

  const rankings = [
    { id: 'goals',   label: 'Máximas goleadoras',      icon: Trophy,    color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', data: [...playerData].sort((a,b)=>b.goals-a.goals).slice(0,8),    getValue: (p:any)=>`${p.goals} goles`,   getSecondary:(p:any)=>`${p.assists} asist.` },
    { id: 'assists', label: 'Más asistencias',          icon: Target,    color: 'text-yellow-400',  bg: 'bg-yellow-500/10 border-yellow-500/20',  data: [...playerData].sort((a,b)=>b.assists-a.assists).slice(0,8), getValue: (p:any)=>`${p.assists} asist.`,getSecondary:(p:any)=>`${p.goals} goles` },
    { id: 'rating',  label: 'Mejor valoradas',          icon: Star,      color: 'text-violet-400',  bg: 'bg-violet-500/10 border-violet-500/20',  data: [...playerData].filter(p=>p.rating>0&&p.matches>=3).sort((a,b)=>b.rating-a.rating).slice(0,8), getValue:(p:any)=>p.rating, getSecondary:(p:any)=>`${p.matches} partidos` },
    { id: 'minutes', label: 'Más minutos',              icon: Clock,     color: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/20',      data: [...playerData].sort((a,b)=>b.minutes-a.minutes).slice(0,8), getValue:(p:any)=>`${p.minutes} min`,    getSecondary:(p:any)=>`${p.matches} partidos` },
    { id: 'passes',  label: 'Mejor % pases',            icon: TrendingUp,color: 'text-cyan-400',    bg: 'bg-cyan-500/10 border-cyan-500/20',      data: [...playerData].filter(p=>p.passAcc!==null&&p.matches>=3).sort((a,b)=>(b.passAcc??0)-(a.passAcc??0)).slice(0,8), getValue:(p:any)=>`${p.passAcc}%`, getSecondary:(p:any)=>`${p.passesOk+p.passesFail} pases` },
    { id: 'recov',   label: 'Mejor % recuperaciones',   icon: Shield,    color: 'text-orange-400',  bg: 'bg-orange-500/10 border-orange-500/20',  data: [...playerData].filter(p=>p.recovAcc!==null&&p.matches>=3).sort((a,b)=>(b.recovAcc??0)-(a.recovAcc??0)).slice(0,8), getValue:(p:any)=>`${p.recovAcc}%`, getSecondary:(p:any)=>`${p.recovOk+p.recovFail} acciones` },
  ]

  // ── Per-player detailed match stats ──
  const selectedPlayer = selectedId ? players.find(p => p.id === selectedId) : null
  const selectedMatchStats = selectedId
    ? await prisma.playerMatchStats.findMany({
        where: { playerId: selectedId, half: 'total' },
        include: { match: { select: { id: true, rival: true, date: true } } },
        orderBy: { match: { date: 'desc' } },
      })
    : []

  const selectedRatings = selectedMatchStats.map(s => calcRating(s))
  const selectedAvg = selectedRatings.length > 0
    ? Math.round(selectedRatings.reduce((a, b) => a + b, 0) / selectedRatings.length)
    : 0

  function statCell(ok: number, fail: number) {
    const total = ok + fail
    const p = pct(ok, fail)
    if (total === 0) return '—'
    const color = p !== null && p >= 70 ? 'text-emerald-400' : p !== null && p >= 50 ? 'text-yellow-400' : 'text-red-400'
    return { value: `${ok}/${total}`, color }
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Estadísticas de Temporada</h1>
        <p className="text-slate-400 text-sm mt-1">Rankings individuales · {totalMatches} partidos jugados</p>
      </div>

      {/* Season summary */}
      <div className="grid grid-cols-3 gap-3">
        {([
          { label: 'Partidos', value: totalMatches, icon: '📅' },
          { label: 'Goles totales', value: totalGoals, icon: '⚽' },
          { label: 'Asistencias', value: totalAssists, icon: '🎯' },
        ] as { label: string; value: number; icon: string }[]).map(({ label, value, icon }) => (
          <div key={label} className="bg-slate-900 rounded-xl p-4 border border-slate-800 text-center">
            <div className="text-2xl mb-1">{icon}</div>
            <div className="text-2xl font-bold text-white">{value}</div>
            <div className="text-xs text-slate-400 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Rankings */}
      {playerData.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <Trophy size={40} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium">Sin estadísticas aún</p>
          <p className="text-sm mt-1">Importa partidos para ver los rankings</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rankings.map(({ id, label, icon: Icon, color, bg, data, getValue, getSecondary }) => (
            <div key={id} className={`border rounded-2xl overflow-hidden ${bg}`}>
              <div className="p-4 border-b border-white/5 flex items-center gap-2">
                <Icon size={16} className={color} />
                <span className="font-semibold text-white text-sm">{label}</span>
              </div>
              {data.length === 0 ? (
                <p className="p-4 text-slate-500 text-sm italic">Sin datos suficientes (mín. 3 partidos)</p>
              ) : (
                <div className="divide-y divide-white/5">
                  {data.map((p: any, i: number) => (
                    <Link key={p.id} href={`/estadisticas?jugadora=${p.id}`}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors">
                      <span className={`text-sm font-bold w-5 ${i === 0 ? color : 'text-slate-500'}`}>{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{p.name}</p>
                        <p className="text-slate-500 text-xs">{p.position ?? '—'}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-bold ${i === 0 ? color : 'text-white'}`}>{getValue(p)}</p>
                        <p className="text-xs text-slate-500">{getSecondary(p)}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Detalle partido a partido ── */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
          <span className="font-semibold text-white">Estadísticas partido a partido</span>
          {selectedPlayer && (
            <Link href="/estadisticas" className="text-xs text-slate-400 hover:text-white transition-colors">
              ← Cambiar jugadora
            </Link>
          )}
        </div>

        {/* Player selector */}
        {!selectedPlayer ? (
          <div className="p-4">
            <p className="text-slate-400 text-sm mb-3">Selecciona una jugadora para ver su desglose por partido:</p>
            <div className="flex flex-wrap gap-2">
              {players.map(p => (
                <Link key={p.id} href={`/estadisticas?jugadora=${p.id}`}
                  className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-500 text-white text-sm px-3 py-1.5 rounded-lg transition-colors">
                  {p.name}
                  <ChevronRight size={13} className="text-slate-500" />
                </Link>
              ))}
              {players.length === 0 && <p className="text-slate-500 text-sm">Sin jugadoras</p>}
            </div>
          </div>
        ) : (
          <div>
            <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-white font-semibold">{selectedPlayer.name}</span>
                {selectedPlayer.position && <span className="text-slate-400 text-sm ml-2">{selectedPlayer.position}</span>}
              </div>
              {selectedAvg > 0 && (
                <span className="text-xs text-slate-400">
                  Media temporada: <span className={`font-bold ${ratingColor(selectedAvg)}`}>{selectedAvg}</span>
                </span>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[860px]">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-800/30">
                    <th className="text-left text-slate-400 font-medium px-4 py-2">Partido</th>
                    <th className="text-center text-slate-400 font-medium px-2 py-2">Val.</th>
                    <th className="text-center text-slate-400 font-medium px-2 py-2">Min</th>
                    <th className="text-center text-slate-400 font-medium px-2 py-2">Pases OK/T</th>
                    <th className="text-center text-slate-400 font-medium px-2 py-2">Tiros OK/T</th>
                    <th className="text-center text-slate-400 font-medium px-2 py-2">Reg OK/T</th>
                    <th className="text-center text-slate-400 font-medium px-2 py-2">Duelos OK/T</th>
                    <th className="text-center text-slate-400 font-medium px-2 py-2">Rec OK/T</th>
                    <th className="text-center text-slate-400 font-medium px-2 py-2">Pérd</th>
                    <th className="text-center text-slate-400 font-medium px-2 py-2">⚽</th>
                    <th className="text-center text-slate-400 font-medium px-2 py-2">🎯</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {selectedMatchStats.map((s, i) => {
                    const r = selectedRatings[i]
                    const diff = selectedAvg > 0 && r > 0 ? r - selectedAvg : null
                    const cells = [
                      statCell(s.passesOk, s.passesFail),
                      statCell(s.shotsOk, s.shotsFail),
                      statCell(s.dribblesOk, s.dribblesFail),
                      statCell(s.duelsOk, s.duelsFail),
                      statCell(s.recovOk, s.recovFail),
                    ]
                    return (
                      <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-2.5">
                          <Link href={`/partidos/${s.matchId}`} className="text-white hover:text-emerald-400 transition-colors font-medium">
                            vs {s.match.rival}
                          </Link>
                          <p className="text-slate-500 text-xs">
                            {new Date(s.match.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                            {diff !== null && (
                              <span className={`ml-2 font-medium ${diff >= 5 ? 'text-emerald-400' : diff <= -5 ? 'text-red-400' : 'text-slate-400'}`}>
                                {diff >= 5 ? '↑' : diff <= -5 ? '↓' : '='} {diff > 0 ? `+${diff}` : diff}
                              </span>
                            )}
                          </p>
                        </td>
                        <td className={`px-2 py-2.5 text-center font-bold ${r > 0 ? ratingColor(r) : 'text-slate-500'}`}>
                          {r > 0 ? r : '—'}
                        </td>
                        <td className="px-2 py-2.5 text-center text-slate-300">{s.minutes || '—'}</td>
                        {cells.map((c, ci) => (
                          <td key={ci} className={`px-2 py-2.5 text-center font-medium ${typeof c === 'string' ? 'text-slate-600' : c.color}`}>
                            {typeof c === 'string' ? c : c.value}
                          </td>
                        ))}
                        <td className="px-2 py-2.5 text-center text-slate-300">{s.losses > 0 ? s.losses : '—'}</td>
                        <td className="px-2 py-2.5 text-center text-emerald-400 font-medium">{s.goals > 0 ? s.goals : '—'}</td>
                        <td className="px-2 py-2.5 text-center text-yellow-400 font-medium">{s.assists > 0 ? s.assists : '—'}</td>
                      </tr>
                    )
                  })}
                  {selectedMatchStats.length === 0 && (
                    <tr>
                      <td colSpan={11} className="px-4 py-8 text-center text-slate-500">Sin datos de partidos para esta jugadora</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

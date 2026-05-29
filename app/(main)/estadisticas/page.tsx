import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/dal'
import { calcRating, ratingColor, pct } from '@/lib/stats'
import Link from 'next/link'
import { Trophy, Star, Clock, Target, Shield, TrendingUp } from 'lucide-react'

export default async function EstadisticasPage() {
  await verifySession()

  const [players, allStats] = await Promise.all([
    prisma.user.findMany({ where: { active: true, role: 'PLAYER' }, select: { id: true, name: true, position: true } }),
    prisma.playerMatchStats.findMany({ where: { half: 'total' } }),
  ])

  const playerData = players.map(p => {
    const stats = allStats.filter(s => s.playerId === p.id)
    if (stats.length === 0) return null
    const totals = stats.reduce(
      (acc, s) => ({
        passesOk: acc.passesOk + s.passesOk,
        passesFail: acc.passesFail + s.passesFail,
        shotsOk: acc.shotsOk + s.shotsOk,
        shotsFail: acc.shotsFail + s.shotsFail,
        dribblesOk: acc.dribblesOk + s.dribblesOk,
        dribblesFail: acc.dribblesFail + s.dribblesFail,
        duelsOk: acc.duelsOk + s.duelsOk,
        duelsFail: acc.duelsFail + s.duelsFail,
        recovOk: acc.recovOk + s.recovOk,
        recovFail: acc.recovFail + s.recovFail,
        goals: acc.goals + s.goals,
        assists: acc.assists + s.assists,
        minutes: acc.minutes + s.minutes,
      }),
      { passesOk: 0, passesFail: 0, shotsOk: 0, shotsFail: 0, dribblesOk: 0, dribblesFail: 0, duelsOk: 0, duelsFail: 0, recovOk: 0, recovFail: 0, goals: 0, assists: 0, minutes: 0 }
    )
    const rating = calcRating(totals)
    const passAcc = pct(totals.passesOk, totals.passesFail)
    const recovAcc = pct(totals.recovOk, totals.recovFail)
    const matches = new Set(stats.map(s => s.matchId)).size
    return { ...p, ...totals, rating, passAcc, recovAcc, matches }
  }).filter(Boolean) as NonNullable<ReturnType<typeof players.map>[0]>[]

  const rankings = [
    {
      id: 'goals',
      label: 'Máximas goleadoras',
      icon: Trophy,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20',
      data: [...playerData].sort((a, b) => (b as any).goals - (a as any).goals).slice(0, 8),
      getValue: (p: any) => `${p.goals} goles`,
      getSecondary: (p: any) => `${p.assists} asist.`,
    },
    {
      id: 'assists',
      label: 'Más asistencias',
      icon: Target,
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/10 border-yellow-500/20',
      data: [...playerData].sort((a, b) => (b as any).assists - (a as any).assists).slice(0, 8),
      getValue: (p: any) => `${p.assists} asist.`,
      getSecondary: (p: any) => `${p.goals} goles`,
    },
    {
      id: 'rating',
      label: 'Mejor valoradas',
      icon: Star,
      color: 'text-violet-400',
      bg: 'bg-violet-500/10 border-violet-500/20',
      data: [...playerData].filter((p: any) => p.rating > 0 && p.matches >= 3).sort((a, b) => (b as any).rating - (a as any).rating).slice(0, 8),
      getValue: (p: any) => p.rating,
      getSecondary: (p: any) => `${p.matches} partidos`,
    },
    {
      id: 'minutes',
      label: 'Más minutos',
      icon: Clock,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10 border-blue-500/20',
      data: [...playerData].sort((a, b) => (b as any).minutes - (a as any).minutes).slice(0, 8),
      getValue: (p: any) => `${p.minutes} min`,
      getSecondary: (p: any) => `${p.matches} partidos`,
    },
    {
      id: 'passes',
      label: 'Mejor % pases',
      icon: TrendingUp,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10 border-cyan-500/20',
      data: [...playerData].filter((p: any) => p.passAcc !== null && p.matches >= 3).sort((a, b) => ((b as any).passAcc ?? 0) - ((a as any).passAcc ?? 0)).slice(0, 8),
      getValue: (p: any) => `${p.passAcc}%`,
      getSecondary: (p: any) => `${p.passesOk + p.passesFail} pases`,
    },
    {
      id: 'recov',
      label: 'Mejor % recuperaciones',
      icon: Shield,
      color: 'text-orange-400',
      bg: 'bg-orange-500/10 border-orange-500/20',
      data: [...playerData].filter((p: any) => p.recovAcc !== null && p.matches >= 3).sort((a, b) => ((b as any).recovAcc ?? 0) - ((a as any).recovAcc ?? 0)).slice(0, 8),
      getValue: (p: any) => `${p.recovAcc}%`,
      getSecondary: (p: any) => `${p.recovOk + p.recovFail} acciones`,
    },
  ]

  const totalMatches = await prisma.match.count()
  const totalGoals = playerData.reduce((s, p) => s + (p as any).goals, 0)
  const totalAssists = playerData.reduce((s, p) => s + (p as any).assists, 0)

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

      {/* Rankings grid */}
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
                    <Link
                      key={p.id}
                      href={`/jugadoras/${p.id}`}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors"
                    >
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
    </div>
  )
}

import { verifySession } from '@/lib/dal'
import { prisma } from '@/lib/prisma'
import { calcRating, ratingColor, pct } from '@/lib/stats'
import Link from 'next/link'

export default async function DashboardPage() {
  const session = await verifySession()

  const [matches, players, allStats] = await Promise.all([
    prisma.match.findMany({ orderBy: { date: 'desc' }, take: 5 }),
    prisma.user.findMany({ where: { active: true, role: 'PLAYER' }, orderBy: { name: 'asc' } }),
    prisma.playerMatchStats.findMany({ where: { half: 'total' } }),
  ])

  const totalMatches = await prisma.match.count()

  // Aggregate season totals
  const seasonTotals = allStats.reduce(
    (acc, s) => ({
      passesOk: acc.passesOk + s.passesOk,
      passesFail: acc.passesFail + s.passesFail,
      shotsOk: acc.shotsOk + s.shotsOk,
      shotsFail: acc.shotsFail + s.shotsFail,
      goals: acc.goals + s.goals,
      assists: acc.assists + s.assists,
      recovOk: acc.recovOk + s.recovOk,
      recovFail: acc.recovFail + s.recovFail,
    }),
    { passesOk: 0, passesFail: 0, shotsOk: 0, shotsFail: 0, goals: 0, assists: 0, recovOk: 0, recovFail: 0 }
  )

  // Top scorers
  const playerGoals = players.map((p) => {
    const stats = allStats.filter((s) => s.playerId === p.id)
    const goals = stats.reduce((s, x) => s + x.goals, 0)
    const assists = stats.reduce((s, x) => s + x.assists, 0)
    const rating = calcRating(stats.reduce(
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
      }),
      { passesOk: 0, passesFail: 0, shotsOk: 0, shotsFail: 0, dribblesOk: 0, dribblesFail: 0, duelsOk: 0, duelsFail: 0, recovOk: 0, recovFail: 0 }
    ))
    return { ...p, goals, assists, rating }
  }).sort((a, b) => b.goals - a.goals).slice(0, 5)

  const teamPasses = pct(seasonTotals.passesOk, seasonTotals.passesFail)
  const teamShots = pct(seasonTotals.shotsOk, seasonTotals.shotsFail)
  const teamRecov = pct(seasonTotals.recovOk, seasonTotals.recovFail)

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Hola, {session.name} 👋</h1>
        <p className="text-slate-400 text-sm mt-1">Temporada en curso · {totalMatches} partidos jugados</p>
      </div>

      {/* Team stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Goles', value: seasonTotals.goals, icon: '⚽' },
          { label: 'Asistencias', value: seasonTotals.assists, icon: '🎯' },
          { label: '% Pases', value: teamPasses !== null ? `${teamPasses}%` : '—', icon: '📊' },
          { label: '% Recuper.', value: teamRecov !== null ? `${teamRecov}%` : '—', icon: '🛡️' },
        ].map(({ label, value, icon }) => (
          <div key={label} className="bg-slate-900 rounded-xl p-4 border border-slate-800">
            <div className="text-2xl mb-1">{icon}</div>
            <div className="text-2xl font-bold text-white">{value}</div>
            <div className="text-xs text-slate-400 mt-1">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Top jugadoras */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
          <div className="p-4 border-b border-slate-800">
            <h2 className="font-semibold text-white">Máximas goleadoras</h2>
          </div>
          <div className="divide-y divide-slate-800">
            {playerGoals.length === 0 && (
              <p className="text-slate-500 text-sm p-4">Sin datos aún</p>
            )}
            {playerGoals.map((p, i) => (
              <Link key={p.id} href={`/jugadoras/${p.id}`} className="flex items-center gap-3 p-4 hover:bg-slate-800/50 transition-colors">
                <span className="text-slate-500 text-sm w-4">{i + 1}</span>
                <div className="flex-1">
                  <p className="text-white font-medium text-sm">{p.name}</p>
                  <p className="text-slate-400 text-xs">{p.position ?? 'Sin posición'}</p>
                </div>
                <div className="text-right">
                  <p className="text-emerald-400 font-bold">{p.goals} ⚽</p>
                  <p className="text-slate-400 text-xs">{p.assists} asist.</p>
                </div>
                <span className={`text-lg font-bold ml-2 ${ratingColor(p.rating)}`}>{p.rating}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Últimos partidos */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h2 className="font-semibold text-white">Últimos partidos</h2>
            <Link href="/partidos" className="text-xs text-emerald-400 hover:text-emerald-300">Ver todos</Link>
          </div>
          <div className="divide-y divide-slate-800">
            {matches.length === 0 && (
              <p className="text-slate-500 text-sm p-4">Sin partidos aún</p>
            )}
            {matches.map((m) => (
              <Link key={m.id} href={`/partidos/${m.id}`} className="flex items-center gap-3 p-4 hover:bg-slate-800/50 transition-colors">
                <div className="flex-1">
                  <p className="text-white text-sm font-medium">vs {m.rival}</p>
                  <p className="text-slate-400 text-xs">
                    {new Date(m.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                    {m.isHome ? ' · Casa' : ' · Fuera'}
                  </p>
                </div>
                {m.result && (
                  <span className="text-white font-bold text-sm bg-slate-700 px-2 py-1 rounded-lg">{m.result}</span>
                )}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Quick actions - only for admin/coach */}
      {(session.role === 'ADMIN' || session.role === 'COACH') && (
        <div className="grid grid-cols-2 gap-3">
          <Link href="/admin/importar" className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 hover:bg-emerald-500/20 transition-colors">
            <div className="text-2xl mb-2">📥</div>
            <p className="text-emerald-400 font-medium text-sm">Importar partido</p>
            <p className="text-slate-400 text-xs mt-1">Sube el Excel de stats</p>
          </Link>
          <Link href="/admin" className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 hover:bg-slate-800 transition-colors">
            <div className="text-2xl mb-2">👥</div>
            <p className="text-white font-medium text-sm">Gestionar plantilla</p>
            <p className="text-slate-400 text-xs mt-1">{players.length} jugadoras</p>
          </Link>
        </div>
      )}
    </div>
  )
}

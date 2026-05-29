import { verifySession } from '@/lib/dal'
import { prisma } from '@/lib/prisma'
import { calcRating, ratingColor, ratingBg, pct, parseResult, resultConfig } from '@/lib/stats'
import Link from 'next/link'
import { Trophy, TrendingUp, Calendar, ArrowRight, Star } from 'lucide-react'

export default async function DashboardPage() {
  const session = await verifySession()
  const isAdmin = session.role === 'ADMIN' || session.role === 'COACH'

  const now = new Date()

  const [matches, players, allStats, teamContext, nextEvents] = await Promise.all([
    prisma.match.findMany({ orderBy: { date: 'desc' }, take: 10 }),
    prisma.user.findMany({ where: { active: true, role: 'PLAYER' }, orderBy: { name: 'asc' } }),
    prisma.playerMatchStats.findMany({ where: { half: 'total' } }),
    prisma.teamContext.findUnique({ where: { id: 'singleton' } }),
    prisma.calendarEvent.findMany({
      where: { date: { gte: now } },
      orderBy: { date: 'asc' },
      take: 3,
    }),
  ])

  // W-D-L record
  const record = matches.reduce(
    (acc, m) => {
      const r = parseResult(m.result)
      if (r === 'win') acc.w++
      else if (r === 'draw') acc.d++
      else if (r === 'loss') acc.l++
      return acc
    },
    { w: 0, d: 0, l: 0 }
  )

  // Season totals
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

  // Last match
  const lastMatch = matches[0]
  const lastMatchStats = lastMatch
    ? allStats.filter(s => s.matchId === lastMatch.id)
    : []
  const lastMatchMVP = lastMatchStats.length > 0
    ? (() => {
        const ranked = lastMatchStats
          .map(s => ({ ...s, r: calcRating(s) }))
          .filter(s => s.r > 0)
          .sort((a, b) => b.r - a.r)
        if (!ranked[0]) return null
        const mvp = ranked[0]
        const player = players.find(p => p.id === mvp.playerId)
        return player ? { ...player, rating: mvp.r, goals: mvp.goals } : null
      })()
    : null

  // Top players by rating
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
        goals: acc.goals + s.goals, assists: acc.assists + s.assists,
      }),
      { passesOk: 0, passesFail: 0, shotsOk: 0, shotsFail: 0, dribblesOk: 0, dribblesFail: 0, duelsOk: 0, duelsFail: 0, recovOk: 0, recovFail: 0, goals: 0, assists: 0 }
    )
    const matchRatings = stats.map(s => calcRating(s)).filter(r => r > 0)
    const avgRating = matchRatings.length > 0 ? Math.round(matchRatings.reduce((a, b) => a + b, 0) / matchRatings.length) : 0
    const last3 = matchRatings.slice(0, 3)
    return { ...p, ...totals, rating: avgRating, last3, matches: stats.length }
  }).filter(Boolean) as any[]

  const topPlayers = [...playerData].sort((a, b) => b.rating - a.rating).slice(0, 6)
  const topScorers = [...playerData].sort((a, b) => b.goals - a.goals).slice(0, 3)

  const teamPasses = pct(seasonTotals.passesOk, seasonTotals.passesFail)
  const teamRecov = pct(seasonTotals.recovOk, seasonTotals.recovFail)

  const eventTypeColors: Record<string, string> = {
    partido: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    entrenamiento: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    descanso: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
    otro: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Hola, {session.name.split(' ')[0]} 👋
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {teamContext?.teamName ?? 'Mi equipo'} · {teamContext?.season ?? 'Temporada'}
          </p>
        </div>
        {/* W-D-L */}
        {(record.w + record.d + record.l) > 0 && (
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2">
            <span className="text-emerald-400 font-bold text-sm">{record.w}V</span>
            <span className="text-slate-600">·</span>
            <span className="text-slate-400 font-bold text-sm">{record.d}E</span>
            <span className="text-slate-600">·</span>
            <span className="text-red-400 font-bold text-sm">{record.l}D</span>
          </div>
        )}
      </div>

      {/* Week message */}
      {teamContext?.weekMessage && (
        <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl px-4 py-3">
          <p className="text-violet-300 text-sm italic">"{teamContext.weekMessage}"</p>
        </div>
      )}

      {/* Top stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Goles', value: seasonTotals.goals, icon: '⚽', color: 'text-emerald-400' },
          { label: 'Asistencias', value: seasonTotals.assists, icon: '🎯', color: 'text-yellow-400' },
          { label: '% Pases', value: teamPasses !== null ? `${teamPasses}%` : '—', icon: '📊', color: 'text-blue-400' },
          { label: '% Recuper.', value: teamRecov !== null ? `${teamRecov}%` : '—', icon: '🛡️', color: 'text-purple-400' },
        ].map(({ label, value, icon, color }) => (
          <div key={label} className="bg-slate-900 rounded-xl p-4 border border-slate-800 hover:border-slate-700 transition-colors">
            <div className="text-2xl mb-2">{icon}</div>
            <div className={`text-2xl font-bold ${color}`}>{value}</div>
            <div className="text-xs text-slate-400 mt-1">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Last match + MVP */}
        {lastMatch && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <span className="font-semibold text-white text-sm">Último partido</span>
              <Link href={`/partidos/${lastMatch.id}`} className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
                Ver <ArrowRight size={12} />
              </Link>
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-white font-semibold">vs {lastMatch.rival}</p>
                  <p className="text-slate-400 text-xs mt-0.5">
                    {new Date(lastMatch.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                    {lastMatch.isHome ? ' · Casa' : ' · Fuera'}
                  </p>
                </div>
                {lastMatch.result && (() => {
                  const r = parseResult(lastMatch.result)
                  const cfg = r ? resultConfig[r] : null
                  return (
                    <div className={`text-center px-4 py-2 rounded-xl border ${cfg ? `${cfg.bg} ${cfg.border}` : 'bg-slate-800 border-slate-700'}`}>
                      <span className={`text-2xl font-black ${cfg ? cfg.text : 'text-white'}`}>{lastMatch.result}</span>
                      {cfg && <p className={`text-xs font-medium mt-0.5 ${cfg.text}`}>{cfg.label === 'V' ? 'Victoria' : cfg.label === 'E' ? 'Empate' : 'Derrota'}</p>}
                    </div>
                  )
                })()}
              </div>
              {lastMatchMVP && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-yellow-500/20 flex items-center justify-center text-sm font-bold text-yellow-400 flex-shrink-0">
                    {lastMatchMVP.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{lastMatchMVP.name}</p>
                    <p className="text-yellow-400/70 text-xs">MVP del partido</p>
                  </div>
                  <span className={`text-xl font-black ${ratingColor(lastMatchMVP.rating)}`}>{lastMatchMVP.rating}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Next events */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <span className="font-semibold text-white text-sm flex items-center gap-2">
              <Calendar size={14} className="text-slate-400" /> Próximos eventos
            </span>
            <Link href="/calendario" className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
              Ver <ArrowRight size={12} />
            </Link>
          </div>
          <div className="divide-y divide-slate-800">
            {nextEvents.length === 0 ? (
              <p className="text-slate-500 text-sm p-4 text-center">Sin eventos próximos</p>
            ) : nextEvents.map(e => (
              <div key={e.id} className="p-3 flex items-center gap-3">
                <div className="text-center w-10 flex-shrink-0">
                  <div className="text-white font-bold text-sm">{new Date(e.date).getDate()}</div>
                  <div className="text-slate-500 text-xs">{new Date(e.date).toLocaleDateString('es-ES', { month: 'short' })}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm truncate">{e.title}</p>
                  <span className={`text-xs px-1.5 py-0.5 rounded border ${eventTypeColors[e.type] ?? eventTypeColors.otro}`}>
                    {e.type}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top rated players */}
      {topPlayers.some((p: any) => p.rating > 0) && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <span className="font-semibold text-white text-sm flex items-center gap-2">
              <Star size={14} className="text-yellow-400" /> Mejores valoradas
            </span>
            <Link href="/estadisticas" className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
              Rankings <ArrowRight size={12} />
            </Link>
          </div>
          <div className="p-4 grid grid-cols-2 md:grid-cols-3 gap-3">
            {topPlayers.filter((p: any) => p.rating > 0).map((p: any, i: number) => (
              <Link key={p.id} href={`/jugadoras/${p.id}`}
                className="flex items-center gap-3 bg-slate-800/50 rounded-xl p-2.5 hover:bg-slate-800 transition-colors">
                <div className="relative flex-shrink-0">
                  <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold text-white">
                    {p.name.charAt(0)}
                  </div>
                  {i === 0 && <span className="absolute -top-1 -right-1 text-xs">⭐</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs font-medium truncate">{p.name.split(' ')[0]}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    {p.last3.map((r: number, j: number) => (
                      <div key={j} className={`w-2 h-2 rounded-full ${ratingBg(r)}`} />
                    ))}
                  </div>
                </div>
                <span className={`text-base font-black ${ratingColor(p.rating)}`}>{p.rating}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recent matches */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <span className="font-semibold text-white text-sm flex items-center gap-2">
            <Trophy size={14} className="text-slate-400" /> Últimos partidos
          </span>
          <Link href="/partidos" className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
            Ver todos <ArrowRight size={12} />
          </Link>
        </div>
        <div className="divide-y divide-slate-800">
          {matches.slice(0, 5).map(m => {
            const r = parseResult(m.result)
            const cfg = r ? resultConfig[r] : null
            return (
              <Link key={m.id} href={`/partidos/${m.id}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-slate-800/50 transition-colors">
                {cfg ? (
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${cfg.bg} ${cfg.text}`}>
                    {cfg.label}
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full bg-slate-800 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium">vs {m.rival}</p>
                  <p className="text-slate-500 text-xs">
                    {new Date(m.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                    {m.isHome ? ' · Casa' : ' · Fuera'}
                  </p>
                </div>
                {m.result && (
                  <span className={`text-sm font-bold ${cfg ? cfg.text : 'text-slate-400'}`}>{m.result}</span>
                )}
              </Link>
            )
          })}
          {matches.length === 0 && (
            <p className="text-slate-500 text-sm p-4 text-center">Sin partidos aún</p>
          )}
        </div>
      </div>

      {/* Quick actions - admin only */}
      {isAdmin && (
        <div className="grid grid-cols-2 gap-3">
          <Link href="/admin/importar" className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 hover:bg-emerald-500/20 transition-colors">
            <div className="text-2xl mb-2">📥</div>
            <p className="text-emerald-400 font-medium text-sm">Importar partido</p>
            <p className="text-slate-400 text-xs mt-1">Sube el Excel de stats</p>
          </Link>
          <Link href="/admin" className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 hover:bg-slate-800 transition-colors">
            <div className="text-2xl mb-2">👥</div>
            <p className="text-white font-medium text-sm">Gestionar plantilla</p>
            <p className="text-slate-400 text-xs mt-1">{players.length} jugadoras activas</p>
          </Link>
        </div>
      )}
    </div>
  )
}

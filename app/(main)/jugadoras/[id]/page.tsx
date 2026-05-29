import { prisma } from '@/lib/prisma'
import { calcRating, ratingColor, ratingBg, pct, calcInjuryRisk, riskConfig } from '@/lib/stats'
import { notFound } from 'next/navigation'
import { verifySession } from '@/lib/dal'
import PlayerRadarChart from '@/components/PlayerRadarChart'
import PhysicalDataForm from './PhysicalDataForm'
import PlayerClips from './PlayerClips'
import Link from 'next/link'
import { ShieldAlert } from 'lucide-react'

export default async function JugadoraPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await verifySession()
  const { id } = await params
  const isAdmin = session.role === 'ADMIN' || session.role === 'COACH'

  const now = new Date()
  const days60ago = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)
  const days28ago = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000)

  const player = await prisma.user.findUnique({
    where: { id },
    include: {
      matchStats: {
        where: { half: 'total' },
        include: { match: true },
        orderBy: { match: { date: 'desc' } },
      },
      injuries: { orderBy: { startDate: 'desc' } },
      clips: { orderBy: { createdAt: 'desc' } },
    },
  })

  if (!player || player.role === 'ADMIN' || player.role === 'COACH') notFound()

  const totals = player.matchStats.reduce(
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
      losses: acc.losses + s.losses,
      minutes: acc.minutes + s.minutes,
    }),
    { passesOk: 0, passesFail: 0, shotsOk: 0, shotsFail: 0, dribblesOk: 0, dribblesFail: 0, duelsOk: 0, duelsFail: 0, recovOk: 0, recovFail: 0, goals: 0, assists: 0, losses: 0, minutes: 0 }
  )

  const rating = calcRating(totals)
  const partidos = player.matchStats.length

  // Contextual ratings per match
  const matchRatings = player.matchStats.map(s => calcRating(s))
  const avgRating = matchRatings.length > 0
    ? Math.round(matchRatings.reduce((a, b) => a + b, 0) / matchRatings.length)
    : 0

  // Last 5 matches form
  const last5 = matchRatings.slice(0, 5)

  // Injury risk calculation (admin only)
  const hasCurrentInjury = player.injuries.some(i => !i.endDate)
  const minutesLast4Weeks = player.matchStats
    .filter(s => new Date(s.match.date) >= days28ago)
    .reduce((sum, s) => sum + s.minutes, 0)
  const avgMinutesPerMatch = partidos > 0 ? totals.minutes / partidos : 0
  const recentInjuryCount = player.injuries.filter(i => new Date(i.startDate) >= days60ago).length

  // Consecutive matches with >80 min (from most recent)
  let consecutiveHighMinutes = 0
  for (const s of player.matchStats) {
    if (s.minutes > 80) consecutiveHighMinutes++
    else break
  }

  const injuryRisk = calcInjuryRisk({
    hasCurrentInjury,
    matchCount: partidos,
    minutesLast4Weeks,
    avgMinutesPerMatch,
    consecutiveHighMinutes,
    recentInjuryCount,
  })

  const statRows = [
    { label: 'Pases', ok: totals.passesOk, fail: totals.passesFail },
    { label: 'Tiros', ok: totals.shotsOk, fail: totals.shotsFail },
    { label: 'Regates', ok: totals.dribblesOk, fail: totals.dribblesFail },
    { label: 'Duelos', ok: totals.duelsOk, fail: totals.duelsFail },
    { label: 'Recuperaciones', ok: totals.recovOk, fail: totals.recovFail },
  ]

  function trendIndicator(matchR: number, avg: number) {
    if (avg === 0 || matchR === 0) return null
    const diff = matchR - avg
    if (diff >= 8) return { label: '↑ Destacada', color: 'text-emerald-400 bg-emerald-500/10' }
    if (diff >= 3) return { label: '↑', color: 'text-emerald-400' }
    if (diff <= -8) return { label: '↓ Bajo nivel', color: 'text-red-400 bg-red-500/10' }
    if (diff <= -3) return { label: '↓', color: 'text-red-400' }
    return { label: '=', color: 'text-slate-400' }
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      <Link href="/jugadoras" className="text-slate-400 hover:text-white text-sm flex items-center gap-1">
        ← Volver
      </Link>

      {/* Header */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center text-2xl font-bold text-white flex-shrink-0">
            {player.name.charAt(0)}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white">{player.name}</h1>
            <p className="text-slate-400">{player.position ?? 'Sin posición asignada'}</p>
            {player.number && <p className="text-slate-500 text-sm">Dorsal #{player.number}</p>}
            {isAdmin && player.dominantFoot && (
              <p className="text-slate-500 text-sm">Pierna: {player.dominantFoot}</p>
            )}
            {/* Last 5 form dots */}
            {last5.length > 0 && (
              <div className="flex items-center gap-1.5 mt-2">
                <span className="text-xs text-slate-500 mr-1">Forma:</span>
                {last5.map((r, i) => (
                  <div
                    key={i}
                    title={r > 0 ? String(r) : 'Sin datos'}
                    className={`w-3 h-3 rounded-full ${r > 0 ? ratingBg(r) : 'bg-slate-700'}`}
                  />
                ))}
              </div>
            )}
          </div>
          <div className="text-right">
            <div className={`text-5xl font-black ${ratingColor(rating)}`}>{rating || '—'}</div>
            <p className="text-slate-400 text-xs mt-1">Valoración media</p>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-4 gap-3 mt-6">
          {[
            { label: 'Partidos', value: partidos },
            { label: 'Goles', value: totals.goals },
            { label: 'Asistencias', value: totals.assists },
            { label: 'Minutos', value: totals.minutes },
          ].map(({ label, value }) => (
            <div key={label} className="bg-slate-800 rounded-xl p-3 text-center">
              <div className="text-xl font-bold text-white">{value}</div>
              <div className="text-xs text-slate-400 mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* Physical summary (admin only) */}
        {isAdmin && (player.height || player.weight || player.birthDate) && (
          <div className="grid grid-cols-3 gap-3 mt-3">
            {player.height && (
              <div className="bg-amber-500/10 rounded-xl p-3 text-center border border-amber-500/20">
                <div className="text-lg font-bold text-amber-400">{player.height} cm</div>
                <div className="text-xs text-slate-400 mt-0.5">Altura</div>
              </div>
            )}
            {player.weight && (
              <div className="bg-amber-500/10 rounded-xl p-3 text-center border border-amber-500/20">
                <div className="text-lg font-bold text-amber-400">{player.weight} kg</div>
                <div className="text-xs text-slate-400 mt-0.5">Peso</div>
              </div>
            )}
            {player.birthDate && (
              <div className="bg-amber-500/10 rounded-xl p-3 text-center border border-amber-500/20">
                <div className="text-lg font-bold text-amber-400">
                  {Math.floor((Date.now() - new Date(player.birthDate).getTime()) / (1000 * 60 * 60 * 24 * 365))}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">Años</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Injury Risk — admin only */}
      {isAdmin && partidos >= 3 && (
        <div className={`border rounded-2xl p-5 ${riskConfig[injuryRisk.level].bg}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert size={18} className={riskConfig[injuryRisk.level].color} />
              <span className="font-semibold text-white text-sm">Riesgo de Lesión</span>
            </div>
            <span className={`text-lg font-bold ${riskConfig[injuryRisk.level].color}`}>
              {riskConfig[injuryRisk.level].label}
            </span>
          </div>
          <div className="mt-3 space-y-1">
            {injuryRisk.factors.map((f, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-slate-300">
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                  injuryRisk.level === 'bajo' ? 'bg-emerald-400' :
                  injuryRisk.level === 'moderado' ? 'bg-yellow-400' :
                  injuryRisk.level === 'alto' ? 'bg-orange-400' : 'bg-red-400'
                }`} />
                {f}
              </div>
            ))}
          </div>
          {partidos > 0 && (
            <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-center">
              <div className="bg-slate-900/40 rounded-lg p-2">
                <div className="text-white font-semibold">{minutesLast4Weeks}</div>
                <div className="text-slate-400">Min. (4 semanas)</div>
              </div>
              <div className="bg-slate-900/40 rounded-lg p-2">
                <div className="text-white font-semibold">{Math.round(avgMinutesPerMatch)}</div>
                <div className="text-slate-400">Media min/partido</div>
              </div>
              <div className="bg-slate-900/40 rounded-lg p-2">
                <div className="text-white font-semibold">{consecutiveHighMinutes}</div>
                <div className="text-slate-400">Consec. &gt;80 min</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Radar chart */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
        <h2 className="font-semibold text-white mb-4">Perfil de rendimiento</h2>
        <PlayerRadarChart stats={totals} />
      </div>

      {/* Stats table */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-800">
          <h2 className="font-semibold text-white">Estadísticas de temporada</h2>
        </div>
        <div className="divide-y divide-slate-800">
          {statRows.map(({ label, ok, fail }) => {
            const p = pct(ok, fail)
            return (
              <div key={label} className="flex items-center gap-4 px-4 py-3">
                <span className="text-slate-300 text-sm w-32 flex-shrink-0">{label}</span>
                <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${p ?? 0}%` }} />
                </div>
                <span className="text-white text-sm font-medium w-10 text-right">{p !== null ? `${p}%` : '—'}</span>
                <span className="text-slate-500 text-xs w-16 text-right">{ok + fail} acciones</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Match by match — full stats */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="font-semibold text-white">Partidos — estadísticas detalladas</h2>
          {avgRating > 0 && (
            <span className="text-xs text-slate-400">Media: <span className={`font-bold ${ratingColor(avgRating)}`}>{avgRating}</span></span>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-800/40">
                <th className="text-left text-slate-400 font-medium px-4 py-2 sticky left-0 bg-slate-800/40">Rival</th>
                <th className="text-center text-slate-400 font-medium px-2 py-2">Val.</th>
                <th className="text-center text-slate-400 font-medium px-2 py-2">Min</th>
                <th className="text-center text-slate-400 font-medium px-2 py-2 whitespace-nowrap">Pases OK/T</th>
                <th className="text-center text-slate-400 font-medium px-2 py-2 whitespace-nowrap">Tiros OK/T</th>
                <th className="text-center text-slate-400 font-medium px-2 py-2 whitespace-nowrap">Reg OK/T</th>
                <th className="text-center text-slate-400 font-medium px-2 py-2 whitespace-nowrap">Duelos OK/T</th>
                <th className="text-center text-slate-400 font-medium px-2 py-2 whitespace-nowrap">Rec OK/T</th>
                <th className="text-center text-slate-400 font-medium px-2 py-2">Pérd</th>
                <th className="text-center text-slate-400 font-medium px-2 py-2">⚽</th>
                <th className="text-center text-slate-400 font-medium px-2 py-2">🎯</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {player.matchStats.map((s, i) => {
                const r = matchRatings[i]
                const trend = trendIndicator(r, avgRating)

                function statCell(ok: number, fail: number) {
                  const total = ok + fail
                  const p = pct(ok, fail)
                  if (total === 0) return <span className="text-slate-600">—</span>
                  return (
                    <span className={p !== null && p >= 70 ? 'text-emerald-400' : p !== null && p >= 50 ? 'text-yellow-400' : 'text-red-400'}>
                      {ok}/{total}
                    </span>
                  )
                }

                return (
                  <tr key={s.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-2.5 sticky left-0 bg-slate-900">
                      <div>
                        <Link href={`/partidos/${s.matchId}`} className="text-white hover:text-emerald-400 transition-colors font-medium">
                          {s.match.rival}
                        </Link>
                        {trend && (
                          <span className={`ml-2 text-xs ${trend.color}`}>{trend.label}</span>
                        )}
                      </div>
                      <p className="text-slate-500 text-xs">
                        {new Date(s.match.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                      </p>
                    </td>
                    <td className={`px-2 py-2.5 text-center font-bold ${r > 0 ? ratingColor(r) : 'text-slate-500'}`}>
                      {r > 0 ? r : '—'}
                    </td>
                    <td className="px-2 py-2.5 text-center text-slate-300">{s.minutes || '—'}</td>
                    <td className="px-2 py-2.5 text-center font-medium">{statCell(s.passesOk, s.passesFail)}</td>
                    <td className="px-2 py-2.5 text-center font-medium">{statCell(s.shotsOk, s.shotsFail)}</td>
                    <td className="px-2 py-2.5 text-center font-medium">{statCell(s.dribblesOk, s.dribblesFail)}</td>
                    <td className="px-2 py-2.5 text-center font-medium">{statCell(s.duelsOk, s.duelsFail)}</td>
                    <td className="px-2 py-2.5 text-center font-medium">{statCell(s.recovOk, s.recovFail)}</td>
                    <td className="px-2 py-2.5 text-center text-slate-300 font-medium">{s.losses > 0 ? s.losses : '—'}</td>
                    <td className="px-2 py-2.5 text-center text-emerald-400 font-medium">{s.goals > 0 ? s.goals : '—'}</td>
                    <td className="px-2 py-2.5 text-center text-yellow-400 font-medium">{s.assists > 0 ? s.assists : '—'}</td>
                  </tr>
                )
              })}
              {player.matchStats.length === 0 && (
                <tr>
                  <td colSpan={11} className="px-4 py-8 text-center text-slate-500">Sin datos de partidos</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Video clips */}
      <PlayerClips
        clips={player.clips.map(c => ({
          id: c.id,
          title: c.title,
          url: c.url,
          description: c.description,
          createdAt: c.createdAt.toISOString(),
        }))}
        playerId={player.id}
        isAdmin={isAdmin}
      />

      {/* Physical data form — admin only */}
      {isAdmin && (
        <PhysicalDataForm
          userId={player.id}
          height={player.height}
          weight={player.weight}
          dominantFoot={player.dominantFoot}
          birthDate={player.birthDate}
        />
      )}
    </div>
  )
}

import { prisma } from '@/lib/prisma'
import { calcRating, ratingColor, pct } from '@/lib/stats'
import { notFound } from 'next/navigation'
import { verifySession } from '@/lib/dal'
import PlayerRadarChart from '@/components/PlayerRadarChart'
import PhysicalDataForm from './PhysicalDataForm'
import Link from 'next/link'

export default async function JugadoraPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await verifySession()
  const { id } = await params
  const isAdmin = session.role === 'ADMIN' || session.role === 'COACH'

  const player = await prisma.user.findUnique({
    where: { id },
    include: {
      matchStats: {
        where: { half: 'total' },
        include: { match: true },
        orderBy: { match: { date: 'desc' } },
      },
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

  const statRows = [
    { label: 'Pases', ok: totals.passesOk, fail: totals.passesFail },
    { label: 'Tiros', ok: totals.shotsOk, fail: totals.shotsFail },
    { label: 'Regates', ok: totals.dribblesOk, fail: totals.dribblesFail },
    { label: 'Duelos', ok: totals.duelsOk, fail: totals.duelsFail },
    { label: 'Recuperaciones', ok: totals.recovOk, fail: totals.recovFail },
  ]

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      {/* Back */}
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
          </div>
          <div className="text-right">
            <div className={`text-5xl font-black ${ratingColor(rating)}`}>{rating || '—'}</div>
            <p className="text-slate-400 text-xs mt-1">Valoración</p>
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
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{ width: `${p ?? 0}%` }}
                  />
                </div>
                <span className="text-white text-sm font-medium w-10 text-right">{p !== null ? `${p}%` : '—'}</span>
                <span className="text-slate-500 text-xs w-16 text-right">{ok + fail} acciones</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Match by match */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-800">
          <h2 className="font-semibold text-white">Partidos</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left text-slate-400 font-medium px-4 py-2">Rival</th>
                <th className="text-center text-slate-400 font-medium px-2 py-2">Min</th>
                <th className="text-center text-slate-400 font-medium px-2 py-2">Pases%</th>
                <th className="text-center text-slate-400 font-medium px-2 py-2">Tiros%</th>
                <th className="text-center text-slate-400 font-medium px-2 py-2">⚽</th>
                <th className="text-center text-slate-400 font-medium px-2 py-2">🎯</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {player.matchStats.map((s) => (
                <tr key={s.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="px-4 py-3 text-white">{s.match.rival}</td>
                  <td className="px-2 py-3 text-center text-slate-300">{s.minutes || '—'}</td>
                  <td className="px-2 py-3 text-center">
                    <span className={pct(s.passesOk, s.passesFail) !== null ? 'text-white' : 'text-slate-500'}>
                      {pct(s.passesOk, s.passesFail) !== null ? `${pct(s.passesOk, s.passesFail)}%` : '—'}
                    </span>
                  </td>
                  <td className="px-2 py-3 text-center">
                    <span className={pct(s.shotsOk, s.shotsFail) !== null ? 'text-white' : 'text-slate-500'}>
                      {pct(s.shotsOk, s.shotsFail) !== null ? `${pct(s.shotsOk, s.shotsFail)}%` : '—'}
                    </span>
                  </td>
                  <td className="px-2 py-3 text-center text-emerald-400 font-medium">{s.goals || '—'}</td>
                  <td className="px-2 py-3 text-center text-yellow-400">{s.assists || '—'}</td>
                </tr>
              ))}
              {player.matchStats.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">Sin datos de partidos</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

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

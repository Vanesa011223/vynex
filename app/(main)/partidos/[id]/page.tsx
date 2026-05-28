import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { verifySession } from '@/lib/dal'
import { calcRating, ratingColor, pct } from '@/lib/stats'
import Link from 'next/link'
import AnalysisPanel from './AnalysisPanel'

export default async function PartidoPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await verifySession()
  const { id } = await params
  const isAdmin = session.role === 'ADMIN' || session.role === 'COACH'

  const match = await prisma.match.findUnique({
    where: { id },
    include: {
      playerStats: {
        where: { half: 'total' },
        include: { player: true },
        orderBy: { player: { name: 'asc' } },
      },
      analysis: true,
    },
  })

  if (!match) notFound()

  const teamTotals = match.playerStats.reduce(
    (acc, s) => ({
      passesOk: acc.passesOk + s.passesOk,
      passesFail: acc.passesFail + s.passesFail,
      shotsOk: acc.shotsOk + s.shotsOk,
      shotsFail: acc.shotsFail + s.shotsFail,
      goals: acc.goals + s.goals,
      assists: acc.assists + s.assists,
    }),
    { passesOk: 0, passesFail: 0, shotsOk: 0, shotsFail: 0, goals: 0, assists: 0 }
  )

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      <Link href="/partidos" className="text-slate-400 hover:text-white text-sm flex items-center gap-1">
        ← Volver
      </Link>

      {/* Match header */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">vs {match.rival}</h1>
            <p className="text-slate-400 text-sm mt-1">
              {new Date(match.date).toLocaleDateString('es-ES', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
              {match.isHome ? ' · Casa' : ' · Fuera'}
              {match.location ? ` · ${match.location}` : ''}
            </p>
          </div>
          {match.result && (
            <span className="text-3xl font-black text-white">{match.result}</span>
          )}
        </div>

        {match.veoUrl && (
          <a href={match.veoUrl} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-4 text-sm text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 px-3 py-2 rounded-lg transition-colors">
            📹 Ver partido en Veo →
          </a>
        )}

        {/* Team totals */}
        <div className="grid grid-cols-4 gap-3 mt-6">
          {[
            { label: 'Goles', value: teamTotals.goals },
            { label: 'Asistencias', value: teamTotals.assists },
            { label: '% Pases', value: pct(teamTotals.passesOk, teamTotals.passesFail) !== null ? `${pct(teamTotals.passesOk, teamTotals.passesFail)}%` : '—' },
            { label: '% Tiros', value: pct(teamTotals.shotsOk, teamTotals.shotsFail) !== null ? `${pct(teamTotals.shotsOk, teamTotals.shotsFail)}%` : '—' },
          ].map(({ label, value }) => (
            <div key={label} className="bg-slate-800 rounded-xl p-3 text-center">
              <div className="text-xl font-bold text-white">{value}</div>
              <div className="text-xs text-slate-400 mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* MVP del partido */}
      {match.playerStats.length > 0 && (() => {
        const withRating = match.playerStats
          .map(s => ({ ...s, r: calcRating(s) }))
          .filter(s => s.r > 0)
          .sort((a, b) => {
            if (b.r !== a.r) return b.r - a.r
            if (b.goals !== a.goals) return b.goals - a.goals
            return b.assists - a.assists
          })
        const mvp = withRating[0]
        if (!mvp) return null
        return (
          <div className="bg-gradient-to-r from-yellow-500/10 to-amber-500/5 border border-yellow-500/30 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">⭐</span>
              <span className="font-semibold text-yellow-400 text-sm uppercase tracking-wide">MVP del Partido</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center text-xl font-black text-yellow-400 flex-shrink-0">
                {mvp.player.name.charAt(0)}
              </div>
              <div className="flex-1">
                <Link href={`/jugadoras/${mvp.playerId}`} className="text-white font-bold text-lg hover:text-yellow-400 transition-colors">
                  {mvp.player.name}
                </Link>
                <p className="text-slate-400 text-sm">{mvp.player.position ?? ''}</p>
              </div>
              <div className="text-right">
                <div className={`text-4xl font-black ${ratingColor(mvp.r)}`}>{mvp.r}</div>
                <div className="flex items-center gap-3 mt-1 justify-end text-sm">
                  {mvp.goals > 0 && <span className="text-emerald-400">⚽ {mvp.goals}</span>}
                  {mvp.assists > 0 && <span className="text-yellow-400">🎯 {mvp.assists}</span>}
                  <span className="text-slate-400">{mvp.minutes} min</span>
                </div>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Player stats table */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-800">
          <h2 className="font-semibold text-white">Estadísticas individuales</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-medium">
                <th className="text-left px-4 py-2">Jugadora</th>
                <th className="text-center px-2 py-2">Val.</th>
                <th className="text-center px-2 py-2">Min</th>
                <th className="text-center px-2 py-2">Pases%</th>
                <th className="text-center px-2 py-2">Tiros%</th>
                <th className="text-center px-2 py-2">Reg%</th>
                <th className="text-center px-2 py-2">Duel%</th>
                <th className="text-center px-2 py-2">Rec%</th>
                <th className="text-center px-2 py-2">⚽</th>
                <th className="text-center px-2 py-2">🎯</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {match.playerStats.map((s) => {
                const r = calcRating(s)
                return (
                  <tr key={s.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/jugadoras/${s.playerId}`} className="text-white hover:text-emerald-400 transition-colors">
                        {s.player.name}
                      </Link>
                    </td>
                    <td className={`px-2 py-3 text-center font-bold ${ratingColor(r)}`}>{r || '—'}</td>
                    <td className="px-2 py-3 text-center text-slate-300">{s.minutes || '—'}</td>
                    <td className="px-2 py-3 text-center text-slate-300">{pct(s.passesOk, s.passesFail) !== null ? `${pct(s.passesOk, s.passesFail)}%` : '—'}</td>
                    <td className="px-2 py-3 text-center text-slate-300">{pct(s.shotsOk, s.shotsFail) !== null ? `${pct(s.shotsOk, s.shotsFail)}%` : '—'}</td>
                    <td className="px-2 py-3 text-center text-slate-300">{pct(s.dribblesOk, s.dribblesFail) !== null ? `${pct(s.dribblesOk, s.dribblesFail)}%` : '—'}</td>
                    <td className="px-2 py-3 text-center text-slate-300">{pct(s.duelsOk, s.duelsFail) !== null ? `${pct(s.duelsOk, s.duelsFail)}%` : '—'}</td>
                    <td className="px-2 py-3 text-center text-slate-300">{pct(s.recovOk, s.recovFail) !== null ? `${pct(s.recovOk, s.recovFail)}%` : '—'}</td>
                    <td className="px-2 py-3 text-center text-emerald-400 font-medium">{s.goals || '—'}</td>
                    <td className="px-2 py-3 text-center text-yellow-400">{s.assists || '—'}</td>
                  </tr>
                )
              })}
              {match.playerStats.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-slate-500">Sin estadísticas importadas</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Analysis — admin only */}
      {isAdmin && (
        <AnalysisPanel
          matchId={id}
          initialNotes={match.analysis?.notes ?? ''}
          initialAiAnalysis={match.analysis?.aiAnalysis ?? ''}
        />
      )}
    </div>
  )
}

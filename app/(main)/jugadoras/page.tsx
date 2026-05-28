import { prisma } from '@/lib/prisma'
import { calcRating, ratingColor, ratingBg } from '@/lib/stats'
import Link from 'next/link'
import { verifySession } from '@/lib/dal'

export default async function JugadorasPage() {
  await verifySession()

  const players = await prisma.user.findMany({
    where: { role: 'PLAYER', active: true },
    orderBy: { name: 'asc' },
    include: {
      matchStats: { where: { half: 'total' } },
    },
  })

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">Jugadoras</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {players.map((p) => {
          const totals = p.matchStats.reduce(
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
            }),
            { passesOk: 0, passesFail: 0, shotsOk: 0, shotsFail: 0, dribblesOk: 0, dribblesFail: 0, duelsOk: 0, duelsFail: 0, recovOk: 0, recovFail: 0, goals: 0, assists: 0 }
          )
          const rating = calcRating(totals)
          const partidos = new Set(p.matchStats.map((s) => s.matchId)).size

          return (
            <Link key={p.id} href={`/jugadoras/${p.id}`} className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-emerald-500/50 transition-all hover:bg-slate-800/50 group">
              {/* Avatar */}
              <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center text-xl font-bold text-white mb-3 group-hover:bg-emerald-500/20 transition-colors">
                {p.name.charAt(0).toUpperCase()}
              </div>

              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-white text-sm leading-tight">{p.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{p.position ?? '—'}</p>
                  {p.number && <p className="text-xs text-slate-500">#{p.number}</p>}
                </div>
                <div className={`text-xl font-bold ${ratingColor(rating)}`}>{rating || '—'}</div>
              </div>

              <div className="mt-3 flex gap-3 text-xs text-slate-400">
                <span>⚽ {totals.goals}</span>
                <span>🎯 {totals.assists}</span>
                <span>{partidos} part.</span>
              </div>
            </Link>
          )
        })}

        {players.length === 0 && (
          <div className="col-span-full text-center py-16 text-slate-500">
            <p className="text-4xl mb-3">👥</p>
            <p>No hay jugadoras todavía</p>
            <p className="text-sm mt-1">Ve a Admin para añadir jugadoras</p>
          </div>
        )}
      </div>
    </div>
  )
}

import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/dal'
import Link from 'next/link'

export default async function PartidosPage() {
  const session = await verifySession()

  const matches = await prisma.match.findMany({
    orderBy: { date: 'desc' },
    include: {
      _count: { select: { playerStats: { where: { half: 'total' } } } },
    },
  })

  const withGoals = await Promise.all(
    matches.map(async (m) => {
      const stats = await prisma.playerMatchStats.aggregate({
        where: { matchId: m.id, half: 'total' },
        _sum: { goals: true, assists: true },
      })
      return { ...m, goals: stats._sum.goals ?? 0, assists: stats._sum.assists ?? 0 }
    })
  )

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Partidos</h1>
        {(session.role === 'ADMIN' || session.role === 'COACH') && (
          <Link
            href="/admin/importar"
            className="bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
          >
            + Importar
          </Link>
        )}
      </div>

      <div className="space-y-3">
        {withGoals.map((m) => (
          <Link
            key={m.id}
            href={`/partidos/${m.id}`}
            className="block bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-emerald-500/40 transition-all hover:bg-slate-800/50"
          >
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-white font-semibold">vs {m.rival}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${m.isHome ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
                    {m.isHome ? 'Casa' : 'Fuera'}
                  </span>
                </div>
                <p className="text-slate-400 text-sm mt-0.5">
                  {new Date(m.date).toLocaleDateString('es-ES', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                  {m.location ? ` · ${m.location}` : ''}
                </p>
              </div>
              <div className="text-right">
                {m.result ? (
                  <span className="text-white font-bold text-lg">{m.result}</span>
                ) : (
                  <span className="text-slate-500 text-sm">Sin resultado</span>
                )}
                <p className="text-slate-400 text-xs mt-1">
                  ⚽ {m.goals} · 🎯 {m.assists}
                </p>
              </div>
            </div>
          </Link>
        ))}

        {matches.length === 0 && (
          <div className="text-center py-16 text-slate-500">
            <p className="text-4xl mb-3">🏆</p>
            <p>No hay partidos registrados</p>
            <p className="text-sm mt-1">Importa el primer partido desde Admin</p>
          </div>
        )}
      </div>
    </div>
  )
}

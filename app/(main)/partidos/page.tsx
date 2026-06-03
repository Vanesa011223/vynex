import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/dal'
import { parseResult, resultConfig } from '@/lib/stats'
import Link from 'next/link'

const PAGE_SIZE = 15

export default async function PartidosPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const session = await verifySession()
  const { page } = await searchParams
  const currentPage = Math.max(1, parseInt(page ?? '1'))

  const [matches, total] = await Promise.all([
    prisma.match.findMany({
      orderBy: { date: 'desc' },
      include: { _count: { select: { playerStats: { where: { half: 'total' } } } } },
      skip: (currentPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.match.count(),
  ])
  const totalPages = Math.ceil(total / PAGE_SIZE)

  const withGoals = await Promise.all(
    matches.map(async (m) => {
      const stats = await prisma.playerMatchStats.aggregate({
        where: { matchId: m.id, half: 'total' },
        _sum: { goals: true, assists: true },
      })
      return { ...m, goals: stats._sum.goals ?? 0, assists: stats._sum.assists ?? 0 }
    })
  )

  const record = withGoals.reduce(
    (acc, m) => {
      const r = parseResult(m.result)
      if (r === 'win') acc.w++
      else if (r === 'draw') acc.d++
      else if (r === 'loss') acc.l++
      return acc
    },
    { w: 0, d: 0, l: 0 }
  )

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Partidos</h1>
          {(record.w + record.d + record.l) > 0 && (
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-emerald-400 font-semibold">{record.w} victorias</span>
              <span className="text-slate-600">·</span>
              <span className="text-xs text-slate-400 font-semibold">{record.d} empates</span>
              <span className="text-slate-600">·</span>
              <span className="text-xs text-red-400 font-semibold">{record.l} derrotas</span>
            </div>
          )}
        </div>
        {(session.role === 'ADMIN' || session.role === 'COACH') && (
          <Link
            href="/admin/importar"
            className="bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
          >
            + Importar
          </Link>
        )}
      </div>

      <div className="space-y-2">
        {withGoals.map((m) => {
          const r = parseResult(m.result)
          const cfg = r ? resultConfig[r] : null
          return (
            <Link
              key={m.id}
              href={`/partidos/${m.id}`}
              className={`block bg-slate-900 border rounded-xl p-4 hover:bg-slate-800/60 transition-all ${
                cfg ? `${cfg.border} hover:${cfg.border}` : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-4">
                {/* Result indicator */}
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  cfg ? `${cfg.bg} ${cfg.text}` : 'bg-slate-800 text-slate-500'
                }`}>
                  {cfg ? cfg.label : '?'}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-white font-semibold">vs {m.rival}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${m.isHome ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
                      {m.isHome ? 'Casa' : 'Fuera'}
                    </span>
                    {m._count.playerStats > 0 && (
                      <span className="text-xs text-slate-500">{m._count.playerStats} jugadoras</span>
                    )}
                  </div>
                  <p className="text-slate-400 text-sm mt-0.5">
                    {new Date(m.date).toLocaleDateString('es-ES', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                    {m.location ? ` · ${m.location}` : ''}
                  </p>
                </div>

                <div className="text-right flex-shrink-0">
                  {m.result ? (
                    <span className={`font-black text-xl ${cfg ? cfg.text : 'text-white'}`}>{m.result}</span>
                  ) : (
                    <span className="text-slate-500 text-sm">—</span>
                  )}
                  {(m.goals > 0 || m.assists > 0) && (
                    <p className="text-slate-400 text-xs mt-1">⚽ {m.goals} · 🎯 {m.assists}</p>
                  )}
                </div>
              </div>
            </Link>
          )
        })}

        {matches.length === 0 && (
          <div className="text-center py-16 text-slate-500">
            <p className="text-4xl mb-3">🏆</p>
            <p>No hay partidos registrados</p>
            <p className="text-sm mt-1">Importa el primer partido desde Admin</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          {currentPage > 1 && (
            <Link href={`/partidos?page=${currentPage - 1}`}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm transition-colors">
              ← Anterior
            </Link>
          )}
          <span className="text-slate-500 text-sm">Página {currentPage} de {totalPages}</span>
          {currentPage < totalPages && (
            <Link href={`/partidos?page=${currentPage + 1}`}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm transition-colors">
              Siguiente →
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

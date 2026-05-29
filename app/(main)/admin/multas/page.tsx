import { prisma } from '@/lib/prisma'
import { verifyAdmin } from '@/lib/dal'
import MultasClient from './MultasClient'

export default async function MultasPage() {
  await verifyAdmin()

  const [fines, players] = await Promise.all([
    prisma.fine.findMany({
      orderBy: { createdAt: 'desc' },
      include: { player: { select: { id: true, name: true, position: true } } },
    }),
    prisma.user.findMany({ where: { role: 'PLAYER', active: true }, orderBy: { name: 'asc' }, select: { id: true, name: true } }),
  ])

  const totalPending = fines.filter(f => !f.paid).reduce((s, f) => s + f.amount, 0)
  const totalPaid = fines.filter(f => f.paid).reduce((s, f) => s + f.amount, 0)

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Multas</h1>
          <p className="text-slate-400 text-sm mt-1">Registro de sanciones económicas</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
          <div className="text-2xl font-black text-red-400">{totalPending.toFixed(2)}€</div>
          <div className="text-xs text-slate-400 mt-1">Pendiente de pago</div>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-center">
          <div className="text-2xl font-black text-emerald-400">{totalPaid.toFixed(2)}€</div>
          <div className="text-xs text-slate-400 mt-1">Total cobrado</div>
        </div>
      </div>

      <MultasClient
        fines={fines.map(f => ({
          id: f.id,
          playerId: f.playerId,
          playerName: f.player.name,
          reason: f.reason,
          amount: f.amount,
          paid: f.paid,
          date: f.date.toISOString(),
          note: f.note,
        }))}
        players={players}
      />
    </div>
  )
}

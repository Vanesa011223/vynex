import { verifyAdmin } from '@/lib/dal'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import AddPlayerForm from './AddPlayerForm'
import AddStaffForm from './AddStaffForm'
import ResetPasswordForm from './ResetPasswordForm'
import DeleteUserButton from './DeleteUserButton'

export default async function AdminPage() {
  await verifyAdmin()

  const [staff, players] = await Promise.all([
    prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'COACH'] } },
      orderBy: { name: 'asc' },
    }),
    prisma.user.findMany({
      where: { role: 'PLAYER' },
      orderBy: { name: 'asc' },
    }),
  ])

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-white">Administración</h1>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/admin/importar" className="bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl p-4 font-medium transition-colors text-center">
          📥 Importar partido
        </Link>
        <Link href="/partidos" className="bg-slate-800 hover:bg-slate-700 text-white rounded-xl p-4 font-medium transition-colors text-center">
          🏆 Ver partidos
        </Link>
      </div>

      {/* Staff */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-800">
          <h2 className="font-semibold text-white">Cuerpo técnico ({staff.length})</h2>
          <p className="text-xs text-slate-500 mt-0.5">Todos tienen acceso de administrador</p>
        </div>

        <AddStaffForm />

        <div className="divide-y divide-slate-800">
          {staff.map((u) => (
            <div key={u.id} className="flex items-center gap-3 px-4 py-3">
              <div className="w-9 h-9 rounded-full bg-emerald-700 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                {u.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{u.name}</p>
                <p className="text-slate-400 text-xs">{u.email}</p>
              </div>
              <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400 flex-shrink-0">Admin</span>
              <ResetPasswordForm userId={u.id} userName={u.name} />
            </div>
          ))}
          {staff.length === 0 && (
            <p className="text-slate-500 text-sm p-4 text-center">Añade miembros del cuerpo técnico usando el formulario de arriba</p>
          )}
        </div>
      </div>

      {/* Players */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-800">
          <h2 className="font-semibold text-white">Plantilla ({players.length} jugadoras)</h2>
        </div>

        <AddPlayerForm />

        <div className="divide-y divide-slate-800">
          {players.map((p) => (
            <div key={p.id} className="flex items-center gap-3 px-4 py-3">
              <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                {p.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{p.name}</p>
                <p className="text-slate-400 text-xs">{p.email}</p>
              </div>
              <div className="text-right flex-shrink-0 mr-2">
                <p className="text-slate-300 text-xs">{p.position ?? '—'}</p>
                {p.number && <p className="text-slate-500 text-xs">#{p.number}</p>}
              </div>
              <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${p.active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-500'}`}>
                {p.active ? 'Activa' : 'Inactiva'}
              </span>
              <ResetPasswordForm userId={p.id} userName={p.name} />
              <DeleteUserButton userId={p.id} userName={p.name} />
            </div>
          ))}
          {players.length === 0 && (
            <p className="text-slate-500 text-sm p-4 text-center">Añade jugadoras usando el formulario de arriba</p>
          )}
        </div>
      </div>
    </div>
  )
}

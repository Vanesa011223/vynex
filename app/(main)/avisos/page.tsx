import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/dal'
import AvisosClient from './AvisosClient'

export default async function AvisosPage() {
  const session = await verifySession()
  const isAdmin = session.role === 'ADMIN' || session.role === 'COACH'
  const now = new Date()

  const notices = await prisma.teamNotice.findMany({
    orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    where: { OR: [{ expiresAt: null }, { expiresAt: { gte: now } }] },
  })

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Avisos del equipo</h1>
        <p className="text-slate-400 text-sm mt-1">Comunicados del cuerpo técnico</p>
      </div>
      <AvisosClient
        notices={notices.map(n => ({
          id: n.id,
          title: n.title,
          content: n.content,
          priority: n.priority,
          createdAt: n.createdAt.toISOString(),
          expiresAt: n.expiresAt?.toISOString() ?? null,
        }))}
        isAdmin={isAdmin}
      />
    </div>
  )
}

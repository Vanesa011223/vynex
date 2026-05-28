import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/dal'
import CalendarGrid from './CalendarGrid'

export default async function CalendarioPage({
  searchParams,
}: {
  searchParams: Promise<{ y?: string; m?: string }>
}) {
  const session = await verifySession()
  const { y, m } = await searchParams

  const now = new Date()
  const year = y ? parseInt(y) : now.getFullYear()
  const month = m !== undefined ? parseInt(m) : now.getMonth()

  const isAdmin = session.role === 'ADMIN' || session.role === 'COACH'

  const [events, teamContext] = await Promise.all([
    prisma.calendarEvent.findMany({ orderBy: { date: 'asc' } }),
    prisma.teamContext.findUnique({ where: { id: 'singleton' } }),
  ])

  const serialized = events.map(e => ({
    id: e.id,
    date: e.date.toISOString(),
    type: e.type,
    title: e.title,
    objectives: e.objectives,
    notes: e.notes,
  }))

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Calendario</h1>
        <span className="text-xs text-slate-400">{teamContext?.season ?? ''}</span>
      </div>

      <CalendarGrid
        year={year}
        month={month}
        events={serialized}
        isAdmin={isAdmin}
        weekMessage={teamContext?.weekMessage ?? ''}
      />
    </div>
  )
}

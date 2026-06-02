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

  const [manualEvents, matches, trainingPlans, teamContext] = await Promise.all([
    prisma.calendarEvent.findMany({ orderBy: { date: 'asc' } }),
    prisma.match.findMany({
      orderBy: { date: 'asc' },
      include: {
        convocatorias: {
          include: { player: { select: { name: true, position: true } } },
          orderBy: { status: 'asc' },
        },
      },
    }),
    prisma.trainingPlan.findMany({
      include: { sessions: { orderBy: { dayOfWeek: 'asc' } } },
      orderBy: { weekStart: 'asc' },
    }),
    prisma.teamContext.findUnique({ where: { id: 'singleton' } }),
  ])

  // ── Manual events ──
  const calEvents = manualEvents.map(e => ({
    id: e.id,
    date: e.date.toISOString(),
    type: e.type,
    title: e.title,
    objectives: e.objectives,
    notes: e.notes,
    source: 'manual' as const,
    matchId: null,
    result: null,
    rival: null,
    isHome: null,
    convocatoria: [],
    sessionType: null,
    duration: null,
  }))

  // ── Matches ──
  const matchEvents = matches.map(match => ({
    id: `match-${match.id}`,
    date: match.date.toISOString(),
    type: 'partido' as const,
    title: `vs ${match.rival}${match.result ? ` (${match.result})` : ''}`,
    objectives: null,
    notes: match.location ?? null,
    source: 'match' as const,
    matchId: match.id,
    result: match.result,
    rival: match.rival,
    isHome: match.isHome,
    convocatoria: match.convocatorias.map(c => ({
      playerId: c.playerId,
      playerName: c.player.name,
      position: c.player.position,
      status: c.status,
    })),
    sessionType: null,
    duration: null,
  }))

  // ── Training sessions → calculate actual dates ──
  const DAY_MS = 24 * 60 * 60 * 1000
  const trainingEvents = trainingPlans.flatMap(plan =>
    plan.sessions.map(session => {
      const weekStart = new Date(plan.weekStart)
      const actualDate = new Date(weekStart.getTime() + (session.dayOfWeek - 1) * DAY_MS)
      return {
        id: `training-${session.id}`,
        date: actualDate.toISOString(),
        type: 'entrenamiento' as const,
        title: session.title,
        objectives: plan.objectives,
        notes: session.notes,
        source: 'training' as const,
        matchId: null,
        result: null,
        rival: null,
        isHome: null,
        convocatoria: [],
        sessionType: session.sessionType,
        duration: session.duration,
      }
    })
  )

  const allEvents = [...calEvents, ...matchEvents, ...trainingEvents].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Calendario</h1>
        <span className="text-xs text-slate-400">{teamContext?.season ?? ''}</span>
      </div>

      <CalendarGrid
        year={year}
        month={month}
        events={allEvents}
        isAdmin={isAdmin}
        weekMessage={teamContext?.weekMessage ?? ''}
      />
    </div>
  )
}

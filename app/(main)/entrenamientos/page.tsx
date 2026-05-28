import { prisma } from '@/lib/prisma'
import { verifyAdmin } from '@/lib/dal'
import EntrenamientosClient from './EntrenamientosClient'

export default async function EntrenamientosPage({
  searchParams,
}: {
  searchParams: Promise<{ planId?: string }>
}) {
  await verifyAdmin()
  const { planId } = await searchParams

  const plans = await prisma.trainingPlan.findMany({
    orderBy: { weekStart: 'desc' },
    include: { sessions: { orderBy: { dayOfWeek: 'asc' } } },
    take: 12,
  })

  const activePlan = planId
    ? plans.find(p => p.id === planId) ?? plans[0]
    : plans[0]

  const serialized = plans.map(p => ({
    id: p.id,
    weekStart: p.weekStart.toISOString(),
    objectives: p.objectives,
    aiPlan: p.aiPlan,
    sessions: p.sessions.map(s => ({
      id: s.id,
      planId: s.planId,
      dayOfWeek: s.dayOfWeek,
      title: s.title,
      sessionType: s.sessionType,
      duration: s.duration,
      notes: s.notes,
    })),
  }))

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Planificador de Entrenamientos</h1>
        <p className="text-slate-400 text-sm mt-1">Organiza la semana con sesiones y planes IA</p>
      </div>
      <EntrenamientosClient plans={serialized} activePlanId={activePlan?.id ?? null} />
    </div>
  )
}

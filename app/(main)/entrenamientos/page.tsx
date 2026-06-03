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

  const [plans, exercises] = await Promise.all([
    prisma.trainingPlan.findMany({
      orderBy: { weekStart: 'desc' },
      include: {
        sessions: {
          orderBy: { dayOfWeek: 'asc' },
          include: {
            exercises: {
              orderBy: { order: 'asc' },
              include: { exercise: true },
            },
          },
        },
      },
      take: 12,
    }),
    prisma.exercise.findMany({
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
      include: { _count: { select: { sessions: true } } },
    }),
  ])

  const activePlan = planId ? plans.find(p => p.id === planId) ?? plans[0] : plans[0]

  const serializedPlans = plans.map(p => ({
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
      exercises: s.exercises.map(e => ({
        id: e.id,
        exerciseId: e.exerciseId,
        name: e.exercise.name,
        category: e.exercise.category,
        duration: e.exercise.duration,
        difficulty: e.exercise.difficulty,
        notes: e.notes,
      })),
    })),
  }))

  const serializedExercises = exercises.map(e => ({
    id: e.id,
    name: e.name,
    category: e.category,
    description: e.description,
    objectives: e.objectives,
    duration: e.duration,
    difficulty: e.difficulty,
    materials: e.materials,
    sessionCount: e._count.sessions,
  }))

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Planificador de Entrenamientos</h1>
        <p className="text-slate-400 text-sm mt-1">Organiza la semana · vincula ejercicios de la biblioteca</p>
      </div>
      <EntrenamientosClient
        plans={serializedPlans}
        exercises={serializedExercises}
        activePlanId={activePlan?.id ?? null}
      />
    </div>
  )
}

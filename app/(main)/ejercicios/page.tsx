import { prisma } from '@/lib/prisma'
import { verifyAdmin } from '@/lib/dal'
import EjerciciosClient from './EjerciciosClient'

export default async function EjerciciosPage() {
  await verifyAdmin()
  const exercises = await prisma.exercise.findMany({
    orderBy: [{ category: 'asc' }, { name: 'asc' }],
    include: { _count: { select: { sessions: true } } },
  })
  const serialized = exercises.map(e => ({
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
        <h1 className="text-2xl font-bold text-white">Biblioteca de Ejercicios</h1>
        <p className="text-slate-400 text-sm mt-1">Banco de ejercicios organizado por categoría</p>
      </div>
      <EjerciciosClient exercises={serialized} />
    </div>
  )
}

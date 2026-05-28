import { prisma } from '@/lib/prisma'
import { verifyAdmin } from '@/lib/dal'
import RivalesClient from './RivalesClient'

export default async function RivalesPage() {
  await verifyAdmin()
  const rivals = await prisma.rival.findMany({ orderBy: { createdAt: 'desc' } })
  const serialized = rivals.map(r => ({
    id: r.id,
    name: r.name,
    competition: r.competition,
    strengths: r.strengths,
    weaknesses: r.weaknesses,
    opportunities: r.opportunities,
    threats: r.threats,
    notes: r.notes,
    aiAnalysis: r.aiAnalysis,
  }))
  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Análisis de Rivales</h1>
          <p className="text-slate-400 text-sm mt-1">DAFO táctico + análisis IA por rival</p>
        </div>
      </div>
      <RivalesClient rivals={serialized} />
    </div>
  )
}

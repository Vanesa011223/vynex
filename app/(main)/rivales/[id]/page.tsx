import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { verifyAdmin } from '@/lib/dal'
import Link from 'next/link'
import RivalDetail from './RivalDetail'

export default async function RivalPage({ params }: { params: Promise<{ id: string }> }) {
  await verifyAdmin()
  const { id } = await params
  const rival = await prisma.rival.findUnique({ where: { id } })
  if (!rival) notFound()

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      <Link href="/rivales" className="text-slate-400 hover:text-white text-sm flex items-center gap-1">
        ← Volver a Rivales
      </Link>
      <RivalDetail
        rival={{
          id: rival.id,
          name: rival.name,
          competition: rival.competition,
          strengths: rival.strengths,
          weaknesses: rival.weaknesses,
          opportunities: rival.opportunities,
          threats: rival.threats,
          notes: rival.notes,
          aiAnalysis: rival.aiAnalysis,
        }}
      />
    </div>
  )
}

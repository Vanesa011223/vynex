import { verifySession } from '@/lib/dal'
import { prisma } from '@/lib/prisma'
import Navigation from '@/components/Navigation'

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const session = await verifySession()
  const now = new Date()

  const urgentCount = await prisma.teamNotice.count({
    where: {
      priority: 'urgent',
      OR: [{ expiresAt: null }, { expiresAt: { gte: now } }],
    },
  })

  return (
    <div className="min-h-screen bg-slate-950">
      <Navigation role={session.role} urgentNoticeCount={urgentCount} />
      <main className="md:pt-16 pb-20 md:pb-0">
        {children}
      </main>
    </div>
  )
}

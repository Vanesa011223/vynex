import { verifySession } from '@/lib/dal'
import Navigation from '@/components/Navigation'

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const session = await verifySession()

  return (
    <div className="min-h-screen bg-slate-950">
      <Navigation role={session.role} />
      <main className="md:pt-16 pb-20 md:pb-0">
        {children}
      </main>
    </div>
  )
}

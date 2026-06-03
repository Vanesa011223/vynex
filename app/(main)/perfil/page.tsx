import { verifySession } from '@/lib/dal'
import { prisma } from '@/lib/prisma'
import ProfileClient from './ProfileClient'

export default async function PerfilPage() {
  const session = await verifySession()
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, name: true, email: true, role: true, position: true, number: true },
  })
  if (!user) return null
  return (
    <div className="p-4 md:p-6 max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-white">Mi perfil</h1>
      <ProfileClient user={user} />
    </div>
  )
}

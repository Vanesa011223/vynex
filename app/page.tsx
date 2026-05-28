import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'

export default async function Home() {
  const session = await getSession()
  if (session?.userId) redirect('/dashboard')

  const hasAdmin = await prisma.user.findFirst({ where: { role: 'ADMIN' } })
  if (!hasAdmin) redirect('/setup')

  redirect('/login')
}

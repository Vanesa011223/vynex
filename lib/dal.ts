'server only'
import { redirect } from 'next/navigation'
import { getSession } from './session'

export async function verifySession() {
  const session = await getSession()
  if (!session?.userId) {
    redirect('/login')
  }
  return session
}

export async function verifyAdmin() {
  const session = await verifySession()
  if (session.role !== 'ADMIN' && session.role !== 'COACH') {
    redirect('/dashboard')
  }
  return session
}

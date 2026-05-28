'use server'
import { redirect } from 'next/navigation'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { createSession, deleteSession } from '@/lib/session'

export async function login(state: { error?: string } | undefined, formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Introduce email y contraseña' }
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    return { error: 'Email o contraseña incorrectos' }
  }

  const match = await bcrypt.compare(password, user.password)
  if (!match) {
    return { error: 'Email o contraseña incorrectos' }
  }

  await createSession(user.id, user.role, user.name)
  redirect('/dashboard')
}

export async function logout() {
  await deleteSession()
  redirect('/login')
}

export async function setupAdmin(state: { error?: string; success?: boolean } | undefined, formData: FormData) {
  const existing = await prisma.user.findFirst({ where: { role: 'ADMIN' } })
  if (existing) {
    return { error: 'Ya existe un administrador' }
  }

  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!name || !email || !password || password.length < 6) {
    return { error: 'Rellena todos los campos (contraseña mínimo 6 caracteres)' }
  }

  const hashed = await bcrypt.hash(password, 10)
  await prisma.user.create({
    data: { name, email, password: hashed, role: 'ADMIN' },
  })

  await createSession(
    (await prisma.user.findUnique({ where: { email } }))!.id,
    'ADMIN',
    name
  )
  redirect('/dashboard')
}

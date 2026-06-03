'use server'
import { revalidatePath } from 'next/cache'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { verifyAdmin, verifySession } from '@/lib/dal'

export async function updateProfile(
  state: { error?: string; success?: boolean } | undefined,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const session = await verifySession()
  const name = (formData.get('name') as string)?.trim()
  if (!name) return { error: 'El nombre es obligatorio' }
  await prisma.user.update({ where: { id: session.userId }, data: { name } })
  revalidatePath('/perfil')
  return { success: true }
}

export async function changePassword(
  state: { error?: string; success?: boolean } | undefined,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const session = await verifySession()
  const current = formData.get('current') as string
  const newPass = formData.get('new') as string
  const confirm = formData.get('confirm') as string
  if (!current || !newPass || newPass.length < 6) return { error: 'La nueva contraseña debe tener al menos 6 caracteres' }
  if (newPass !== confirm) return { error: 'Las contraseñas no coinciden' }
  const user = await prisma.user.findUnique({ where: { id: session.userId } })
  if (!user) return { error: 'Usuario no encontrado' }
  const valid = await bcrypt.compare(current, user.password)
  if (!valid) return { error: 'La contraseña actual no es correcta' }
  const hashed = await bcrypt.hash(newPass, 10)
  await prisma.user.update({ where: { id: session.userId }, data: { password: hashed } })
  return { success: true }
}

export async function addPlayer(
  state: { error?: string; success?: boolean } | undefined,
  formData: FormData
) {
  await verifyAdmin()
  const name = (formData.get('name') as string)?.trim()
  const email = (formData.get('email') as string)?.trim()
  const position = (formData.get('position') as string)?.trim() || null
  const number = formData.get('number') ? Number(formData.get('number')) : null
  const password = (formData.get('password') as string)?.trim()

  if (!name || !email || !password || password.length < 6) {
    return { error: 'Nombre, email y contraseña (mín 6 caracteres) son obligatorios' }
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return { error: 'Ya existe una cuenta con ese email' }

  const hashed = await bcrypt.hash(password, 10)
  await prisma.user.create({
    data: { name, email, password: hashed, role: 'PLAYER', position, number },
  })

  revalidatePath('/admin')
  revalidatePath('/jugadoras')
  return { success: true }
}

export async function addStaff(
  state: { error?: string; success?: boolean } | undefined,
  formData: FormData
) {
  await verifyAdmin()
  const name = (formData.get('name') as string)?.trim()
  const email = (formData.get('email') as string)?.trim()
  const password = (formData.get('password') as string)?.trim()

  if (!name || !email || !password || password.length < 6) {
    return { error: 'Nombre, email y contraseña (mín 6 caracteres) son obligatorios' }
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return { error: 'Ya existe una cuenta con ese email' }

  const hashed = await bcrypt.hash(password, 10)
  await prisma.user.create({
    data: { name, email, password: hashed, role: 'ADMIN' },
  })

  revalidatePath('/admin')
  return { success: true }
}

export async function resetPassword(
  state: { error?: string; success?: boolean } | undefined,
  formData: FormData
) {
  await verifyAdmin()
  const userId = formData.get('userId') as string
  const password = (formData.get('password') as string)?.trim()

  if (!userId || !password || password.length < 6) {
    return { error: 'Contraseña mínimo 6 caracteres' }
  }

  const hashed = await bcrypt.hash(password, 10)
  await prisma.user.update({ where: { id: userId }, data: { password: hashed } })

  revalidatePath('/admin')
  return { success: true }
}

export async function deleteUser(
  state: { error?: string; success?: boolean } | undefined,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  await verifyAdmin()
  const userId = formData.get('userId') as string
  if (!userId) return { error: 'Usuario no encontrado' }

  await prisma.user.delete({ where: { id: userId } })

  revalidatePath('/admin')
  revalidatePath('/jugadoras')
  return { success: true }
}

export async function updatePhysicalData(
  state: { error?: string; success?: boolean } | undefined,
  formData: FormData
) {
  await verifyAdmin()
  const userId = formData.get('userId') as string
  const height = formData.get('height') ? Number(formData.get('height')) : null
  const weight = formData.get('weight') ? Number(formData.get('weight')) : null
  const dominantFoot = (formData.get('dominantFoot') as string) || null
  const birthDate = formData.get('birthDate') ? new Date(formData.get('birthDate') as string) : null

  if (!userId) return { error: 'Jugadora no encontrada' }

  await prisma.user.update({
    where: { id: userId },
    data: { height, weight, dominantFoot, birthDate },
  })

  revalidatePath(`/jugadoras/${userId}`)
  return { success: true }
}

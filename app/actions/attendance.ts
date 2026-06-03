'use server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { verifyAdmin } from '@/lib/dal'

export async function upsertAttendance(
  state: { error?: string; success?: boolean } | undefined,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  await verifyAdmin()
  const playerId = formData.get('playerId') as string
  const date = formData.get('date') as string
  const type = formData.get('type') as string
  const note = (formData.get('note') as string)?.trim() || null
  if (!playerId || !date || !type) return { error: 'Faltan datos' }
  const dateObj = new Date(date)
  const existing = await prisma.attendance.findFirst({ where: { playerId, date: dateObj } })
  if (existing) {
    await prisma.attendance.update({ where: { id: existing.id }, data: { type, note } })
  } else {
    await prisma.attendance.create({ data: { playerId, date: dateObj, type, note } })
  }
  revalidatePath('/admin/asistencia')
  revalidatePath(`/jugadoras/${playerId}`)
  return { success: true }
}

export async function deleteAttendance(
  state: { error?: string; success?: boolean } | undefined,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  await verifyAdmin()
  const id = formData.get('id') as string
  await prisma.attendance.delete({ where: { id } })
  revalidatePath('/admin/asistencia')
  return { success: true }
}

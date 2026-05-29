'use server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { verifyAdmin } from '@/lib/dal'

export async function addFine(
  state: { error?: string; success?: boolean } | undefined,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  await verifyAdmin()
  const playerId = formData.get('playerId') as string
  const reason = (formData.get('reason') as string)?.trim()
  const amount = parseFloat(formData.get('amount') as string) || 0
  const note = (formData.get('note') as string)?.trim() || null
  const dateStr = formData.get('date') as string

  if (!playerId || !reason) return { error: 'Jugadora y motivo son obligatorios' }

  await prisma.fine.create({
    data: { playerId, reason, amount, note, date: dateStr ? new Date(dateStr) : new Date() },
  })
  revalidatePath('/admin/multas')
  return { success: true }
}

export async function toggleFinePaid(
  state: { error?: string; success?: boolean } | undefined,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  await verifyAdmin()
  const id = formData.get('id') as string
  const current = formData.get('paid') === 'true'
  await prisma.fine.update({ where: { id }, data: { paid: !current } })
  revalidatePath('/admin/multas')
  return { success: true }
}

export async function deleteFine(
  state: { error?: string; success?: boolean } | undefined,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  await verifyAdmin()
  const id = formData.get('id') as string
  await prisma.fine.delete({ where: { id } })
  revalidatePath('/admin/multas')
  return { success: true }
}

'use server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { verifyAdmin } from '@/lib/dal'

export async function upsertConvocatoria(
  state: { error?: string; success?: boolean } | undefined,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  await verifyAdmin()
  const matchId = formData.get('matchId') as string
  const playerId = formData.get('playerId') as string
  const status = formData.get('status') as string
  const note = (formData.get('note') as string)?.trim() || null

  if (!matchId || !playerId || !status) return { error: 'Faltan datos' }

  await prisma.convocatoria.upsert({
    where: { matchId_playerId: { matchId, playerId } },
    create: { matchId, playerId, status, note },
    update: { status, note },
  })

  revalidatePath(`/partidos/${matchId}`)
  return { success: true }
}

export async function deleteConvocatoria(
  state: { error?: string; success?: boolean } | undefined,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  await verifyAdmin()
  const matchId = formData.get('matchId') as string
  const playerId = formData.get('playerId') as string
  await prisma.convocatoria.deleteMany({ where: { matchId, playerId } })
  revalidatePath(`/partidos/${matchId}`)
  return { success: true }
}

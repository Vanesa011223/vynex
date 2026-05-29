'use server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { verifyAdmin } from '@/lib/dal'

export async function addClip(
  state: { error?: string; success?: boolean } | undefined,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  await verifyAdmin()
  const playerId = formData.get('playerId') as string
  const title = (formData.get('title') as string)?.trim()
  const url = (formData.get('url') as string)?.trim()
  const description = (formData.get('description') as string)?.trim() || null

  if (!playerId || !title || !url) return { error: 'Título y URL son obligatorios' }
  if (!url.startsWith('http')) return { error: 'La URL debe empezar por http' }

  await prisma.playerClip.create({ data: { playerId, title, url, description } })
  revalidatePath(`/jugadoras/${playerId}`)
  return { success: true }
}

export async function deleteClip(
  state: { error?: string; success?: boolean } | undefined,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  await verifyAdmin()
  const id = formData.get('id') as string
  const playerId = formData.get('playerId') as string
  await prisma.playerClip.delete({ where: { id } })
  revalidatePath(`/jugadoras/${playerId}`)
  return { success: true }
}

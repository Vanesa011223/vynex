'use server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { verifyAdmin } from '@/lib/dal'

export async function addRival(
  state: { error?: string; success?: boolean } | undefined,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  await verifyAdmin()
  const name = (formData.get('name') as string)?.trim()
  const competition = (formData.get('competition') as string)?.trim() || null
  if (!name) return { error: 'El nombre del rival es obligatorio' }
  await prisma.rival.create({ data: { name, competition } })
  revalidatePath('/rivales')
  return { success: true }
}

export async function updateRivalSwot(
  state: { error?: string; success?: boolean } | undefined,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  await verifyAdmin()
  const id = formData.get('id') as string
  const strengths = (formData.get('strengths') as string)?.trim() || null
  const weaknesses = (formData.get('weaknesses') as string)?.trim() || null
  const opportunities = (formData.get('opportunities') as string)?.trim() || null
  const threats = (formData.get('threats') as string)?.trim() || null
  const notes = (formData.get('notes') as string)?.trim() || null
  await prisma.rival.update({ where: { id }, data: { strengths, weaknesses, opportunities, threats, notes } })
  revalidatePath(`/rivales/${id}`)
  return { success: true }
}

export async function updateRivalVideo(
  state: { error?: string; success?: boolean } | undefined,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  await verifyAdmin()
  const id = formData.get('id') as string
  const videoUrl = (formData.get('videoUrl') as string)?.trim() || null
  const videoNotes = (formData.get('videoNotes') as string)?.trim() || null
  await prisma.rival.update({ where: { id }, data: { videoUrl, videoNotes } })
  revalidatePath(`/rivales/${id}`)
  return { success: true }
}

export async function deleteRival(
  state: { error?: string; success?: boolean } | undefined,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  await verifyAdmin()
  const id = formData.get('id') as string
  await prisma.rival.delete({ where: { id } })
  revalidatePath('/rivales')
  return { success: true }
}

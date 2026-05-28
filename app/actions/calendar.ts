'use server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { verifyAdmin } from '@/lib/dal'

export async function addCalendarEvent(
  state: { error?: string; success?: boolean } | undefined,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  await verifyAdmin()

  const date = formData.get('date') as string
  const type = formData.get('type') as string
  const title = (formData.get('title') as string)?.trim()
  const objectives = (formData.get('objectives') as string)?.trim() || null
  const notes = (formData.get('notes') as string)?.trim() || null

  if (!date || !type || !title) return { error: 'Fecha, tipo y título son obligatorios' }

  await prisma.calendarEvent.create({
    data: { date: new Date(date), type, title, objectives, notes },
  })

  revalidatePath('/calendario')
  return { success: true }
}

export async function deleteCalendarEvent(
  state: { error?: string; success?: boolean } | undefined,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  await verifyAdmin()
  const id = formData.get('id') as string
  await prisma.calendarEvent.delete({ where: { id } })
  revalidatePath('/calendario')
  return { success: true }
}

export async function updateTeamContext(
  state: { error?: string; success?: boolean } | undefined,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  await verifyAdmin()

  const teamName = (formData.get('teamName') as string)?.trim()
  const season = (formData.get('season') as string)?.trim()
  const competition = (formData.get('competition') as string)?.trim() || ''
  const playingStyle = (formData.get('playingStyle') as string)?.trim() || ''
  const weekMessage = (formData.get('weekMessage') as string)?.trim() || ''

  await prisma.teamContext.upsert({
    where: { id: 'singleton' },
    create: { id: 'singleton', teamName: teamName || 'Mi equipo', season: season || '2025/26', competition, playingStyle, weekMessage },
    update: { teamName: teamName || 'Mi equipo', season: season || '2025/26', competition, playingStyle, weekMessage },
  })

  revalidatePath('/vynex')
  revalidatePath('/calendario')
  return { success: true }
}

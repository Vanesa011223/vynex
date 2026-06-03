'use server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { verifyAdmin } from '@/lib/dal'

export async function createTrainingPlan(
  state: { error?: string; success?: boolean; id?: string } | undefined,
  formData: FormData
): Promise<{ error?: string; success?: boolean; id?: string }> {
  await verifyAdmin()
  const weekStart = formData.get('weekStart') as string
  const objectives = (formData.get('objectives') as string)?.trim() || null
  if (!weekStart) return { error: 'La fecha de inicio de semana es obligatoria' }
  const plan = await prisma.trainingPlan.create({ data: { weekStart: new Date(weekStart), objectives } })
  revalidatePath('/entrenamientos')
  return { success: true, id: plan.id }
}

export async function updateTrainingPlanObjectives(
  state: { error?: string; success?: boolean } | undefined,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  await verifyAdmin()
  const id = formData.get('planId') as string
  const objectives = (formData.get('objectives') as string)?.trim() || null
  await prisma.trainingPlan.update({ where: { id }, data: { objectives } })
  revalidatePath('/entrenamientos')
  return { success: true }
}

export async function addTrainingSession(
  state: { error?: string; success?: boolean } | undefined,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  await verifyAdmin()
  const planId = formData.get('planId') as string
  const dayOfWeek = parseInt(formData.get('dayOfWeek') as string)
  const title = (formData.get('title') as string)?.trim()
  const sessionType = (formData.get('sessionType') as string)?.trim()
  const durationRaw = formData.get('duration') as string
  const duration = durationRaw ? parseInt(durationRaw) : null
  const notes = (formData.get('notes') as string)?.trim() || null
  if (!planId || !title || !sessionType) return { error: 'Faltan campos obligatorios' }
  await prisma.trainingSession.create({ data: { planId, dayOfWeek, title, sessionType, duration, notes } })
  revalidatePath('/entrenamientos')
  return { success: true }
}

export async function updateTrainingSession(
  state: { error?: string; success?: boolean } | undefined,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  await verifyAdmin()
  const id = formData.get('id') as string
  const title = (formData.get('title') as string)?.trim()
  const sessionType = (formData.get('sessionType') as string)?.trim()
  const durationRaw = formData.get('duration') as string
  const duration = durationRaw ? parseInt(durationRaw) : null
  const notes = (formData.get('notes') as string)?.trim() || null
  if (!title || !sessionType) return { error: 'Faltan campos obligatorios' }
  await prisma.trainingSession.update({ where: { id }, data: { title, sessionType, duration, notes } })
  revalidatePath('/entrenamientos')
  return { success: true }
}

export async function deleteTrainingSession(
  state: { error?: string; success?: boolean } | undefined,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  await verifyAdmin()
  const id = formData.get('id') as string
  await prisma.trainingSession.delete({ where: { id } })
  revalidatePath('/entrenamientos')
  return { success: true }
}

export async function addExerciseToSession(
  state: { error?: string; success?: boolean } | undefined,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  await verifyAdmin()
  const sessionId = formData.get('sessionId') as string
  const exerciseId = formData.get('exerciseId') as string
  const notes = (formData.get('notes') as string)?.trim() || null
  if (!sessionId || !exerciseId) return { error: 'Faltan datos' }
  await prisma.trainingSessionExercise.upsert({
    where: { sessionId_exerciseId: { sessionId, exerciseId } },
    create: { sessionId, exerciseId, notes },
    update: { notes },
  })
  revalidatePath('/entrenamientos')
  return { success: true }
}

export async function removeExerciseFromSession(
  state: { error?: string; success?: boolean } | undefined,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  await verifyAdmin()
  const sessionId = formData.get('sessionId') as string
  const exerciseId = formData.get('exerciseId') as string
  await prisma.trainingSessionExercise.deleteMany({ where: { sessionId, exerciseId } })
  revalidatePath('/entrenamientos')
  return { success: true }
}

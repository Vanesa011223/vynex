'use server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { verifyAdmin } from '@/lib/dal'

export async function addExercise(
  state: { error?: string; success?: boolean } | undefined,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  await verifyAdmin()
  const name = (formData.get('name') as string)?.trim()
  const category = (formData.get('category') as string)?.trim()
  const description = (formData.get('description') as string)?.trim() || null
  const objectives = (formData.get('objectives') as string)?.trim() || null
  const durationRaw = formData.get('duration') as string
  const duration = durationRaw ? parseInt(durationRaw) : null
  const difficulty = (formData.get('difficulty') as string)?.trim() || null
  const materials = (formData.get('materials') as string)?.trim() || null
  if (!name || !category) return { error: 'Nombre y categoría son obligatorios' }
  await prisma.exercise.create({ data: { name, category, description, objectives, duration, difficulty, materials } })
  revalidatePath('/ejercicios')
  return { success: true }
}

export async function deleteExercise(
  state: { error?: string; success?: boolean } | undefined,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  await verifyAdmin()
  const id = formData.get('id') as string
  await prisma.exercise.delete({ where: { id } })
  revalidatePath('/ejercicios')
  return { success: true }
}

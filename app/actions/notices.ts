'use server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { verifyAdmin } from '@/lib/dal'

export async function addNotice(
  state: { error?: string; success?: boolean } | undefined,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  await verifyAdmin()
  const title = (formData.get('title') as string)?.trim()
  const content = (formData.get('content') as string)?.trim()
  const priority = (formData.get('priority') as string) || 'normal'
  const expiresAtStr = formData.get('expiresAt') as string

  if (!title || !content) return { error: 'Título y contenido son obligatorios' }

  await prisma.teamNotice.create({
    data: {
      title,
      content,
      priority,
      expiresAt: expiresAtStr ? new Date(expiresAtStr) : null,
    },
  })
  revalidatePath('/avisos')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function deleteNotice(
  state: { error?: string; success?: boolean } | undefined,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  await verifyAdmin()
  const id = formData.get('id') as string
  await prisma.teamNotice.delete({ where: { id } })
  revalidatePath('/avisos')
  revalidatePath('/dashboard')
  return { success: true }
}

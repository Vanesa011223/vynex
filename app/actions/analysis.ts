'use server'
import { revalidatePath } from 'next/cache'
import Anthropic from '@anthropic-ai/sdk'
import { prisma } from '@/lib/prisma'
import { verifyAdmin } from '@/lib/dal'

type AnalysisState = { error?: string; success?: boolean; analysis?: string }

export async function saveMatchNotes(
  state: AnalysisState | undefined,
  formData: FormData
): Promise<AnalysisState> {
  await verifyAdmin()
  const matchId = formData.get('matchId') as string
  const notes = (formData.get('notes') as string) ?? ''

  await prisma.matchAnalysis.upsert({
    where: { matchId },
    create: { matchId, notes },
    update: { notes },
  })

  revalidatePath(`/partidos/${matchId}`)
  return { success: true }
}

export async function generateAIAnalysis(
  state: AnalysisState | undefined,
  formData: FormData
): Promise<AnalysisState> {
  await verifyAdmin()

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return { error: 'Falta la clave API de IA. Añade ANTHROPIC_API_KEY en el archivo .env' }
  }

  const matchId = formData.get('matchId') as string
  const prompt = (formData.get('prompt') as string)?.trim()

  if (!prompt) return { error: 'Escribe algo sobre el partido primero' }

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      playerStats: {
        where: { half: 'total' },
        include: { player: true },
      },
    },
  })

  if (!match) return { error: 'Partido no encontrado' }

  const statsContext = match.playerStats
    .map(s => `- ${s.player.name}: ${s.minutes}min, pases ${s.passesOk}/${s.passesOk + s.passesFail}, tiros ${s.shotsOk}/${s.shotsOk + s.shotsFail}, regates ${s.dribblesOk}/${s.dribblesOk + s.dribblesFail}, duelos ${s.duelsOk}/${s.duelsOk + s.duelsFail}, recuperaciones ${s.recovOk}/${s.recovOk + s.recovFail}, goles ${s.goals}, asistencias ${s.assists}`)
    .join('\n')

  const client = new Anthropic({ apiKey })

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `Eres un analista táctico de fútbol femenino. Analiza este partido y da feedback constructivo al cuerpo técnico.

Partido: ${match.rival} (${match.isHome ? 'Casa' : 'Fuera'}) - Resultado: ${match.result ?? 'No registrado'}

Estadísticas del partido:
${statsContext}

Descripción del cuerpo técnico:
${prompt}

Proporciona un análisis táctico conciso con: puntos fuertes, áreas de mejora y 2-3 recomendaciones concretas para el próximo partido. Responde en español.`,
      },
    ],
  })

  const analysis = message.content[0].type === 'text' ? message.content[0].text : ''

  await prisma.matchAnalysis.upsert({
    where: { matchId },
    create: { matchId, aiAnalysis: analysis },
    update: { aiAnalysis: analysis },
  })

  revalidatePath(`/partidos/${matchId}`)
  return { success: true, analysis }
}

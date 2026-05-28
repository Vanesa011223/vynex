import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { verifySession } from '@/lib/dal'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await verifySession()
  if (session.role !== 'ADMIN' && session.role !== 'COACH') {
    return new Response('Forbidden', { status: 403 })
  }

  const { planId } = await req.json()
  const plan = await prisma.trainingPlan.findUnique({ where: { id: planId }, include: { sessions: true } })
  if (!plan) return new Response('Not found', { status: 404 })

  const weekEnd = new Date(plan.weekStart.getTime() + 7 * 24 * 60 * 60 * 1000)
  const [teamContext, upcomingEvents, injuries, players] = await Promise.all([
    prisma.teamContext.findUnique({ where: { id: 'singleton' } }),
    prisma.calendarEvent.findMany({
      where: { date: { gte: plan.weekStart, lte: weekEnd } },
      orderBy: { date: 'asc' },
    }),
    prisma.injury.findMany({ where: { endDate: null }, include: { player: true } }),
    prisma.user.findMany({ where: { active: true, role: 'PLAYER' }, select: { name: true } }),
  ])

  const client = new Anthropic()

  const systemPrompt = `Eres preparador físico y entrenador de fútbol femenino experto. Tu equipo es "${teamContext?.teamName ?? 'el equipo'}" con estilo: "${teamContext?.playingStyle ?? 'no definido'}". Responde siempre en español con un plan detallado y práctico.`

  const injuredNames = injuries.map(i => i.player.name).join(', ') || 'ninguna'
  const eventsText = upcomingEvents.length > 0
    ? upcomingEvents.map(e => `  - ${new Date(e.date).toLocaleDateString('es-ES', { weekday: 'long', day: '2-digit', month: '2-digit' })}: ${e.title} (${e.type})`).join('\n')
    : '  Ninguno'
  const existingSessions = plan.sessions.length > 0
    ? plan.sessions.map(s => {
        const days = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
        return `  - ${days[s.dayOfWeek] ?? `Día ${s.dayOfWeek}`}: ${s.title} (${s.sessionType})`
      }).join('\n')
    : '  Ninguna sesión planificada aún'

  const weekLabel = plan.weekStart.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })

  const userPrompt = `Genera un plan de entrenamiento completo para la semana del ${weekLabel}.

CONTEXTO DEL EQUIPO:
- Jugadoras disponibles: ${players.length} (${players.map(p => p.name).join(', ')})
- Lesionadas/bajas: ${injuredNames}
- Eventos esta semana:
${eventsText}
- Objetivos declarados: ${plan.objectives || 'no especificados'}
- Sesiones ya planificadas:
${existingSessions}

Genera el plan de Lunes a Sábado (si hay partido esa semana, ajusta la carga). Para cada día incluye:
1. Objetivo principal de la sesión
2. Calentamiento (10-15 min) con actividades específicas
3. Parte principal (ejercicios con duración estimada y descripción)
4. Vuelta a la calma (10 min)
5. Notas del entrenador`

  const collected: string[] = []
  const encoder = new TextEncoder()

  const readable = new ReadableStream({
    async start(controller) {
      try {
        const stream = client.messages.stream({
          model: 'claude-sonnet-4-6',
          max_tokens: 2000,
          system: systemPrompt,
          messages: [{ role: 'user', content: userPrompt }],
        })

        for await (const chunk of stream) {
          if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
            collected.push(chunk.delta.text)
            controller.enqueue(encoder.encode(chunk.delta.text))
          }
        }

        controller.close()
        const aiPlan = collected.join('')
        await prisma.trainingPlan.update({ where: { id: planId }, data: { aiPlan } })
      } catch (err) {
        controller.error(err)
      }
    },
  })

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}

import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session?.userId || (session.role !== 'ADMIN' && session.role !== 'COACH')) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { message } = await req.json()
  if (!message?.trim()) return new Response('Empty message', { status: 400 })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return Response.json({ error: 'Falta ANTHROPIC_API_KEY en .env' }, { status: 500 })
  }

  // Save user message
  await prisma.chatMessage.create({ data: { role: 'user', content: message } })

  // Build context
  const [ctx, injuries, upcomingMatches, recentMatches, players, upcomingEvents] = await Promise.all([
    prisma.teamContext.findUnique({ where: { id: 'singleton' } }),
    prisma.injury.findMany({ where: { endDate: null }, include: { player: true } }),
    prisma.match.findMany({
      where: { date: { gte: new Date() } },
      orderBy: { date: 'asc' },
      take: 3,
    }),
    prisma.match.findMany({
      where: { date: { lt: new Date() }, result: { not: null } },
      orderBy: { date: 'desc' },
      take: 3,
    }),
    prisma.user.findMany({ where: { role: 'PLAYER', active: true }, select: { name: true, position: true, number: true } }),
    prisma.calendarEvent.findMany({
      where: { date: { gte: new Date() } },
      orderBy: { date: 'asc' },
      take: 10,
    }),
  ])

  const history = await prisma.chatMessage.findMany({
    orderBy: { createdAt: 'asc' },
    take: 20,
  })
  // Exclude the message we just saved (last one) for building history
  const historyForContext = history.slice(0, -1)

  const systemPrompt = `Eres VAYNEX, el asistente de IA personal del cuerpo técnico de ${ctx?.teamName ?? 'el equipo'}. Actúas como un staff profesional completo especializado en fútbol femenino.

TEMPORADA: ${ctx?.season ?? '2025/26'} | COMPETICIÓN: ${ctx?.competition ?? 'No especificada'}

MODELO DE JUEGO DEL EQUIPO:
${ctx?.playingStyle || 'No definido todavía. Puedes pedirle al cuerpo técnico que te lo describa.'}

PLANTILLA ACTIVA (${players.length} jugadoras):
${players.map(p => `- ${p.name}${p.position ? ` (${p.position})` : ''}${p.number ? ` #${p.number}` : ''}`).join('\n') || 'Sin jugadoras registradas'}

LESIONADAS ACTUALMENTE:
${injuries.length > 0 ? injuries.map(i => `- ${i.player.name}: ${i.type}`).join('\n') : 'Ninguna'}

PRÓXIMOS PARTIDOS:
${upcomingMatches.length > 0 ? upcomingMatches.map(m => `- ${new Date(m.date).toLocaleDateString('es-ES')} vs ${m.rival} (${m.isHome ? 'Casa' : 'Fuera'})`).join('\n') : 'Sin partidos programados'}

ÚLTIMOS RESULTADOS:
${recentMatches.length > 0 ? recentMatches.map(m => `- vs ${m.rival}: ${m.result}`).join('\n') : 'Sin resultados'}

PRÓXIMOS EVENTOS EN EL CALENDARIO:
${upcomingEvents.length > 0 ? upcomingEvents.map(e => `- ${new Date(e.date).toLocaleDateString('es-ES')} [${e.type}] ${e.title}${e.objectives ? `: ${e.objectives}` : ''}`).join('\n') : 'Sin eventos programados'}

Tu función es:
- Dar contexto semanal proactivo (rival, preparación, objetivos)
- Ayudar a planificar entrenamientos con sentido táctico
- Analizar rivales y sugerir planes de partido
- Gestionar el calendario y recordar eventos importantes
- Apoyar en cualquier decisión deportiva
- Ser directo, práctico y hablar como un colega experto

Responde siempre en español. Sé conciso pero completo.`

  const client = new Anthropic({ apiKey })

  const messages = [
    ...historyForContext.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    { role: 'user' as const, content: message },
  ]

  const encoder = new TextEncoder()
  let fullResponse = ''

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const response = await client.messages.stream({
          model: 'claude-sonnet-4-6',
          max_tokens: 1024,
          system: systemPrompt,
          messages,
        })

        for await (const chunk of response) {
          if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
            fullResponse += chunk.delta.text
            controller.enqueue(encoder.encode(chunk.delta.text))
          }
        }

        // Save assistant response
        await prisma.chatMessage.create({ data: { role: 'assistant', content: fullResponse } })
        controller.close()
      } catch (err) {
        controller.error(err)
      }
    },
  })

  return new Response(stream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}

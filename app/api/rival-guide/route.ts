import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { verifySession } from '@/lib/dal'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await verifySession()
  if (session.role !== 'ADMIN' && session.role !== 'COACH') {
    return new Response('Forbidden', { status: 403 })
  }

  const { rivalId } = await req.json()
  const rival = await prisma.rival.findUnique({ where: { id: rivalId } })
  if (!rival) return new Response('Not found', { status: 404 })

  const teamContext = await prisma.teamContext.findUnique({ where: { id: 'singleton' } })
  const client = new Anthropic()

  const systemPrompt = `Eres un analista táctico experto en fútbol femenino. Tu equipo es "${teamContext?.teamName ?? 'nuestro equipo'}" con estilo: "${teamContext?.playingStyle ?? 'no definido'}". Genera guías de observación prácticas y concretas para el cuerpo técnico.`

  const userPrompt = `Genera una guía de observación táctica detallada para analizar un vídeo del rival "${rival.name}"${rival.competition ? ` (${rival.competition})` : ''}.

Lo que ya sabemos del rival:
- Fortalezas conocidas: ${rival.strengths || 'no especificado'}
- Debilidades conocidas: ${rival.weaknesses || 'no especificado'}
- Notas previas: ${rival.notes || 'ninguna'}

Crea una guía estructurada con preguntas y aspectos concretos a observar en el vídeo, organizada en estas secciones:

**1. SISTEMA Y ORGANIZACIÓN DEFENSIVA** (qué bloque usan, línea defensiva alta/baja, presión, coberturas)

**2. ORGANIZACIÓN OFENSIVA** (sistema de juego, construcción desde atrás, transiciones, combinaciones habituales)

**3. JUGADORAS CLAVE** (quién lleva el juego, quién remata, quién presiona, quién organiza)

**4. PUNTOS DÉBILES A CONFIRMAR** (aspectos donde explorar vulnerabilidades basándote en lo que ya sabes)

**5. ADAPTACIONES TÁCTICAS RECOMENDADAS** (qué ajustar en nuestro juego según lo que veas)

Sé muy específica y práctica — el cuerpo técnico debe poder tomar notas punto por punto mientras ve el vídeo.`

  const collected: string[] = []
  const encoder = new TextEncoder()

  const readable = new ReadableStream({
    async start(controller) {
      try {
        const stream = client.messages.stream({
          model: 'claude-sonnet-4-6',
          max_tokens: 1500,
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
        const guide = collected.join('')
        await prisma.rival.update({ where: { id: rivalId }, data: { observationGuide: guide } })
      } catch (err) {
        controller.error(err)
      }
    },
  })

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}

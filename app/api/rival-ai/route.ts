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

  const systemPrompt = `Eres un analista táctico experto en fútbol femenino. Tu equipo es "${teamContext?.teamName ?? 'nuestro equipo'}", compite en "${teamContext?.competition ?? 'liga'}" con estilo de juego: "${teamContext?.playingStyle ?? 'no definido'}". Responde siempre en español, de forma clara y práctica para un cuerpo técnico.`

  const userPrompt = `Analiza tácticamente al rival "${rival.name}"${rival.competition ? ` (${rival.competition})` : ''}.

ANÁLISIS DAFO:
• Fortalezas: ${rival.strengths || 'no especificado'}
• Debilidades: ${rival.weaknesses || 'no especificado'}
• Oportunidades: ${rival.opportunities || 'no especificado'}
• Amenazas: ${rival.threats || 'no especificado'}
• Notas adicionales: ${rival.notes || 'ninguna'}

Proporciona:
1. **Análisis táctico** del rival (sistema de juego, patrones, amenazas principales)
2. **Cómo explotar sus debilidades** (acciones concretas)
3. **Cómo neutralizar sus fortalezas** (ajustes defensivos)
4. **Plan de juego recomendado** para este partido
5. **Puntos clave de entrenamiento** esta semana para preparar el partido`

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
        const aiAnalysis = collected.join('')
        await prisma.rival.update({ where: { id: rivalId }, data: { aiAnalysis } })
      } catch (err) {
        controller.error(err)
      }
    },
  })

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}

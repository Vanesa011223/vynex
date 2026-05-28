import { verifyAdmin } from '@/lib/dal'
import { prisma } from '@/lib/prisma'
import VaynexChat from './VaynexChat'


export default async function VaynexPage() {
  await verifyAdmin()

  const [messages, teamContext] = await Promise.all([
    prisma.chatMessage.findMany({ orderBy: { createdAt: 'asc' }, take: 40 }),
    prisma.teamContext.findUnique({ where: { id: 'singleton' } }),
  ])

  return (
    <div className="h-[calc(100vh-4rem)] md:h-screen md:pt-16 overflow-hidden">
      <VaynexChat
        initialMessages={messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }))}
        teamContext={teamContext}
      />
    </div>
  )
}

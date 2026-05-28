import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session?.userId || (session.role !== 'ADMIN' && session.role !== 'COACH')) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  const body = await req.json()
  const { rival, date, location, result, isHome, veoUrl, players } = body

  if (!rival || !date || !Array.isArray(players)) {
    return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
  }

  // Create match
  const match = await prisma.match.create({
    data: {
      rival,
      date: new Date(date),
      location: location || null,
      result: result || null,
      isHome: Boolean(isHome),
      veoUrl: veoUrl || null,
    },
  })

  // Match or create players and import stats
  let imported = 0
  for (const p of players) {
    if (!p.name?.trim()) continue

    // Try to find existing player by name (case-insensitive)
    let player = await prisma.user.findFirst({
      where: { name: { equals: p.name.trim() }, role: 'PLAYER' },
    })

    if (!player) {
      // Auto-create player without login credentials (can be updated later)
      const safeName = p.name.trim().toLowerCase().replace(/\s+/g, '.')
      const email = `${safeName}@equipo.local`
      const existing = await prisma.user.findUnique({ where: { email } })
      if (!existing) {
        const bcrypt = await import('bcryptjs')
        const pw = await bcrypt.hash(Math.random().toString(36), 10)
        player = await prisma.user.create({
          data: { name: p.name.trim(), email, password: pw, role: 'PLAYER' },
        })
      } else {
        player = existing
      }
    }

    await prisma.playerMatchStats.upsert({
      where: { matchId_playerId_half: { matchId: match.id, playerId: player.id, half: 'total' } },
      update: {
        minutes: p.minutes ?? 0,
        passesOk: p.passesOk ?? 0, passesFail: p.passesFail ?? 0,
        shotsOk: p.shotsOk ?? 0, shotsFail: p.shotsFail ?? 0,
        dribblesOk: p.dribblesOk ?? 0, dribblesFail: p.dribblesFail ?? 0,
        duelsOk: p.duelsOk ?? 0, duelsFail: p.duelsFail ?? 0,
        recovOk: p.recovOk ?? 0, recovFail: p.recovFail ?? 0,
        losses: p.losses ?? 0, offside: p.offside ?? 0,
        goals: p.goals ?? 0, assists: p.assists ?? 0,
      },
      create: {
        matchId: match.id, playerId: player.id, half: 'total',
        minutes: p.minutes ?? 0,
        passesOk: p.passesOk ?? 0, passesFail: p.passesFail ?? 0,
        shotsOk: p.shotsOk ?? 0, shotsFail: p.shotsFail ?? 0,
        dribblesOk: p.dribblesOk ?? 0, dribblesFail: p.dribblesFail ?? 0,
        duelsOk: p.duelsOk ?? 0, duelsFail: p.duelsFail ?? 0,
        recovOk: p.recovOk ?? 0, recovFail: p.recovFail ?? 0,
        losses: p.losses ?? 0, offside: p.offside ?? 0,
        goals: p.goals ?? 0, assists: p.assists ?? 0,
      },
    })
    imported++
  }

  return NextResponse.json({ matchId: match.id, imported })
}

import { prisma } from '@/lib/prisma'
import { verifyAdmin } from '@/lib/dal'
import AsistenciaClient from './AsistenciaClient'

export default async function AsistenciaPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>
}) {
  await verifyAdmin()
  const { date } = await searchParams
  const selectedDate = date ?? new Date().toISOString().split('T')[0]
  const dateObj = new Date(selectedDate)
  const nextDay = new Date(dateObj.getTime() + 24 * 60 * 60 * 1000)

  const [players, attendance] = await Promise.all([
    prisma.user.findMany({ where: { role: 'PLAYER', active: true }, orderBy: { name: 'asc' } }),
    prisma.attendance.findMany({
      where: { date: { gte: dateObj, lt: nextDay } },
      include: { player: { select: { name: true } } },
    }),
  ])

  // Attendance stats per player (season)
  const allAttendance = await prisma.attendance.findMany({ select: { playerId: true, type: true } })
  const attendanceStats = players.map(p => {
    const records = allAttendance.filter(a => a.playerId === p.id)
    const total = records.length
    const present = records.filter(a => a.type === 'presente' || a.type === 'tarde').length
    const pct = total > 0 ? Math.round((present / total) * 100) : null
    return { playerId: p.id, total, present, pct }
  })

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Control de Asistencia</h1>
        <p className="text-slate-400 text-sm mt-1">Registro de presencia en entrenamientos</p>
      </div>
      <AsistenciaClient
        players={players.map(p => ({ id: p.id, name: p.name, position: p.position }))}
        attendance={attendance.map(a => ({ id: a.id, playerId: a.playerId, type: a.type, note: a.note }))}
        selectedDate={selectedDate}
        attendanceStats={attendanceStats}
      />
    </div>
  )
}

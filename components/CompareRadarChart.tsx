'use client'
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, Legend } from 'recharts'
import { pct } from '@/lib/stats'

type Stats = {
  passesOk: number; passesFail: number
  shotsOk: number; shotsFail: number
  dribblesOk: number; dribblesFail: number
  duelsOk: number; duelsFail: number
  recovOk: number; recovFail: number
}

export default function CompareRadarChart({
  statsA, nameA, statsB, nameB,
}: {
  statsA: Stats; nameA: string
  statsB: Stats; nameB: string
}) {
  const data = [
    { stat: 'Pases',    A: pct(statsA.passesOk, statsA.passesFail) ?? 0,    B: pct(statsB.passesOk, statsB.passesFail) ?? 0 },
    { stat: 'Recuper.', A: pct(statsA.recovOk, statsA.recovFail) ?? 0,      B: pct(statsB.recovOk, statsB.recovFail) ?? 0 },
    { stat: 'Duelos',   A: pct(statsA.duelsOk, statsA.duelsFail) ?? 0,      B: pct(statsB.duelsOk, statsB.duelsFail) ?? 0 },
    { stat: 'Regates',  A: pct(statsA.dribblesOk, statsA.dribblesFail) ?? 0,B: pct(statsB.dribblesOk, statsB.dribblesFail) ?? 0 },
    { stat: 'Tiros',    A: pct(statsA.shotsOk, statsA.shotsFail) ?? 0,      B: pct(statsB.shotsOk, statsB.shotsFail) ?? 0 },
  ]

  return (
    <ResponsiveContainer width="100%" height={280}>
      <RadarChart data={data}>
        <PolarGrid stroke="#334155" />
        <PolarAngleAxis dataKey="stat" tick={{ fill: '#94a3b8', fontSize: 12 }} />
        <Radar name={nameA} dataKey="A" stroke="#10b981" fill="#10b981" fillOpacity={0.2} dot={{ fill: '#10b981', r: 3 }} />
        <Radar name={nameB} dataKey="B" stroke="#a78bfa" fill="#a78bfa" fillOpacity={0.2} dot={{ fill: '#a78bfa', r: 3 }} />
        <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
      </RadarChart>
    </ResponsiveContainer>
  )
}

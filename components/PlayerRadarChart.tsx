'use client'
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from 'recharts'
import { pct } from '@/lib/stats'

type Stats = {
  passesOk: number; passesFail: number
  shotsOk: number; shotsFail: number
  dribblesOk: number; dribblesFail: number
  duelsOk: number; duelsFail: number
  recovOk: number; recovFail: number
}

export default function PlayerRadarChart({ stats }: { stats: Stats }) {
  const data = [
    { stat: 'Pases', value: pct(stats.passesOk, stats.passesFail) ?? 0 },
    { stat: 'Recuper.', value: pct(stats.recovOk, stats.recovFail) ?? 0 },
    { stat: 'Duelos', value: pct(stats.duelsOk, stats.duelsFail) ?? 0 },
    { stat: 'Regates', value: pct(stats.dribblesOk, stats.dribblesFail) ?? 0 },
    { stat: 'Tiros', value: pct(stats.shotsOk, stats.shotsFail) ?? 0 },
  ]

  return (
    <ResponsiveContainer width="100%" height={260}>
      <RadarChart data={data}>
        <PolarGrid stroke="#334155" />
        <PolarAngleAxis
          dataKey="stat"
          tick={{ fill: '#94a3b8', fontSize: 12 }}
        />
        <Radar
          name="jugadora"
          dataKey="value"
          stroke="#10b981"
          fill="#10b981"
          fillOpacity={0.25}
          dot={{ fill: '#10b981', r: 3 }}
        />
      </RadarChart>
    </ResponsiveContainer>
  )
}

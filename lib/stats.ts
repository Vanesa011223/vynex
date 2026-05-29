export function pct(ok: number, fail: number): number | null {
  return ok + fail > 0 ? Math.round((ok / (ok + fail)) * 100) : null
}

export function calcRating(stats: {
  passesOk: number; passesFail: number
  shotsOk: number; shotsFail: number
  dribblesOk: number; dribblesFail: number
  duelsOk: number; duelsFail: number
  recovOk: number; recovFail: number
}): number {
  const weights = [
    { val: pct(stats.passesOk, stats.passesFail), w: 0.30 },
    { val: pct(stats.recovOk, stats.recovFail), w: 0.25 },
    { val: pct(stats.duelsOk, stats.duelsFail), w: 0.20 },
    { val: pct(stats.dribblesOk, stats.dribblesFail), w: 0.15 },
    { val: pct(stats.shotsOk, stats.shotsFail), w: 0.10 },
  ]
  const active = weights.filter((x) => x.val !== null)
  if (active.length === 0) return 0
  const totalW = active.reduce((s, x) => s + x.w, 0)
  const sum = active.reduce((s, x) => s + x.val! * x.w, 0)
  return Math.round(sum / totalW)
}

export function ratingColor(r: number): string {
  if (r >= 80) return 'text-emerald-400'
  if (r >= 65) return 'text-yellow-400'
  if (r >= 50) return 'text-orange-400'
  return 'text-red-400'
}

export function ratingBg(r: number): string {
  if (r >= 80) return 'bg-emerald-500'
  if (r >= 65) return 'bg-yellow-500'
  if (r >= 50) return 'bg-orange-500'
  return 'bg-red-500'
}

export function parseResult(result: string | null): 'win' | 'draw' | 'loss' | null {
  if (!result) return null
  const parts = result.split('-').map(s => parseInt(s.trim()))
  if (parts.length !== 2 || isNaN(parts[0]) || isNaN(parts[1])) return null
  if (parts[0] > parts[1]) return 'win'
  if (parts[0] === parts[1]) return 'draw'
  return 'loss'
}

export const resultConfig = {
  win:  { label: 'V', bg: 'bg-emerald-500/20', border: 'border-emerald-500/40', text: 'text-emerald-400', dot: 'bg-emerald-500' },
  draw: { label: 'E', bg: 'bg-slate-500/20',   border: 'border-slate-500/40',   text: 'text-slate-400',   dot: 'bg-slate-500'  },
  loss: { label: 'D', bg: 'bg-red-500/20',      border: 'border-red-500/40',     text: 'text-red-400',     dot: 'bg-red-500'    },
}

export type RiskLevel = 'bajo' | 'moderado' | 'alto' | 'muy_alto'

export const riskConfig: Record<RiskLevel, { label: string; color: string; bg: string }> = {
  bajo:     { label: 'Bajo',     color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  moderado: { label: 'Moderado', color: 'text-yellow-400',  bg: 'bg-yellow-500/10 border-yellow-500/20'  },
  alto:     { label: 'Alto',     color: 'text-orange-400',  bg: 'bg-orange-500/10 border-orange-500/20'  },
  muy_alto: { label: 'Muy alto', color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/20'        },
}

export function calcInjuryRisk(data: {
  hasCurrentInjury: boolean
  matchCount: number
  minutesLast4Weeks: number
  avgMinutesPerMatch: number
  consecutiveHighMinutes: number
  recentInjuryCount: number
}): { level: RiskLevel; factors: string[] } {
  if (data.hasCurrentInjury) {
    return { level: 'muy_alto', factors: ['Lesionada actualmente'] }
  }
  if (data.matchCount < 3) {
    return { level: 'bajo', factors: ['Datos insuficientes (menos de 3 partidos)'] }
  }

  const factors: string[] = []
  let score = 0

  const expectedMinutes = data.avgMinutesPerMatch * 4
  if (expectedMinutes > 0) {
    const ratio = data.minutesLast4Weeks / expectedMinutes
    if (ratio > 1.4)      { score += 3; factors.push('Carga muy alta en las últimas 4 semanas') }
    else if (ratio > 1.2) { score += 2; factors.push('Carga elevada en las últimas 4 semanas') }
    else if (ratio > 1.0) { score += 1; factors.push('Carga ligeramente por encima de la media') }
  }

  if (data.consecutiveHighMinutes >= 5)      { score += 2; factors.push(`${data.consecutiveHighMinutes} partidos consecutivos con más de 80 min`) }
  else if (data.consecutiveHighMinutes >= 3) { score += 1; factors.push(`${data.consecutiveHighMinutes} partidos consecutivos con más de 80 min`) }

  if (data.recentInjuryCount >= 2)      { score += 2; factors.push(`${data.recentInjuryCount} lesiones en los últimos 60 días`) }
  else if (data.recentInjuryCount === 1) { score += 1; factors.push('1 lesión en los últimos 60 días') }

  if (factors.length === 0) factors.push('Sin factores de riesgo detectados')

  const level: RiskLevel = score >= 5 ? 'muy_alto' : score >= 3 ? 'alto' : score >= 1 ? 'moderado' : 'bajo'
  return { level, factors }
}

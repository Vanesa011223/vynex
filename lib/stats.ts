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

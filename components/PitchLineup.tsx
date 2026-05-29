import { ratingColor } from '@/lib/stats'

type PitchPlayer = {
  id: string
  name: string
  position: string | null
  rating: number
  goals: number
  minutes: number
}

function classifyPosition(pos: string | null): 'gk' | 'def' | 'mid' | 'fwd' | 'unknown' {
  if (!pos) return 'unknown'
  const p = pos.toLowerCase()
  if (p.includes('porter') || p === 'gk' || p === 'gki') return 'gk'
  if (p.includes('delan') || p.includes('extrem') || p.includes('punta') || p.includes('fwd') || p.includes('ariete')) return 'fwd'
  if (p.includes('medio') || p.includes('centrocam') || p.includes('pivote') || p.includes('mid') || p.includes('volante')) return 'mid'
  if (p.includes('defensa') || p.includes('central') || p.includes('lateral') || p.includes('def') || p.includes('zaguera')) return 'def'
  return 'unknown'
}

const ZONE_LABELS = { gk: 'Portera', def: 'Defensas', mid: 'Centrocampistas', fwd: 'Delanteras' }
const ZONE_ORDER: Array<'fwd' | 'mid' | 'def' | 'gk'> = ['fwd', 'mid', 'def', 'gk']

function PlayerDot({ player }: { player: PitchPlayer }) {
  return (
    <div className="flex flex-col items-center gap-1 w-16">
      <div className={`w-9 h-9 rounded-full bg-slate-800 border-2 border-slate-600 flex items-center justify-center text-xs font-bold ${ratingColor(player.rating)}`}>
        {player.rating > 0 ? player.rating : player.name.charAt(0)}
      </div>
      <span className="text-white text-xs text-center leading-tight w-full truncate text-center">{player.name.split(' ')[0]}</span>
      {player.goals > 0 && (
        <span className="text-emerald-400 text-xs -mt-0.5">⚽ {player.goals}</span>
      )}
    </div>
  )
}

export default function PitchLineup({ players }: { players: PitchPlayer[] }) {
  const grouped: Record<string, PitchPlayer[]> = { gk: [], def: [], mid: [], fwd: [], unknown: [] }
  for (const p of players) {
    const zone = classifyPosition(p.position)
    grouped[zone].push(p)
  }

  // Move unknowns to mid
  grouped.mid.push(...grouped.unknown)

  const hasAnyData = ZONE_ORDER.some(z => grouped[z].length > 0)
  if (!hasAnyData) return null

  return (
    <div
      className="relative rounded-xl overflow-hidden"
      style={{
        background: 'linear-gradient(to bottom, #166534 0%, #15803d 50%, #166534 100%)',
        minHeight: '320px',
      }}
    >
      {/* Pitch markings */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Center circle */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full border border-white/20" />
        {/* Center line */}
        <div className="absolute top-1/2 left-4 right-4 h-px bg-white/20" />
        {/* Penalty areas */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-36 h-14 border border-white/20" />
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-36 h-14 border border-white/20" />
        {/* Goal areas */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-16 h-6 border border-white/20" />
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-16 h-6 border border-white/20" />
      </div>

      {/* Players */}
      <div className="relative z-10 flex flex-col justify-around py-4 px-2 min-h-[320px]">
        {ZONE_ORDER.map(zone => {
          const zonePlayers = grouped[zone]
          if (zonePlayers.length === 0) return null
          return (
            <div key={zone} className="flex flex-col items-center gap-1">
              <div className="flex items-center justify-center gap-3 flex-wrap">
                {zonePlayers.map(p => <PlayerDot key={p.id} player={p} />)}
              </div>
            </div>
          )
        })}
      </div>

      {/* Zone labels on side */}
      <div className="absolute right-2 top-0 bottom-0 flex flex-col justify-around py-4 pointer-events-none">
        {ZONE_ORDER.filter(z => grouped[z].length > 0).map(zone => (
          <span key={zone} className="text-white/30 text-xs vertical-text" style={{ writingMode: 'vertical-rl' }}>
            {ZONE_LABELS[zone]}
          </span>
        ))}
      </div>
    </div>
  )
}

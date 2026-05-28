'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import * as XLSX from 'xlsx'

type PlayerRow = {
  name: string
  minutes: number
  passesOk: number; passesFail: number
  shotsOk: number; shotsFail: number
  dribblesOk: number; dribblesFail: number
  duelsOk: number; duelsFail: number
  recovOk: number; recovFail: number
  losses: number; offside: number
  goals: number; assists: number
}

const SKIP = ['JUGADORAS', '% ACIERTOS', 'TOTAL', 'RIVAL', '']

function parseNum(val: unknown): number {
  if (val === null || val === undefined || val === '') return 0
  if (typeof val === 'number') return isNaN(val) ? 0 : Math.round(val)
  const n = parseFloat(String(val))
  return isNaN(n) ? 0 : Math.round(n)
}

function parseSheet(rows: unknown[][]): PlayerRow[] {
  const result: PlayerRow[] = []
  let inFinal = false

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const col0 = String(row[0] ?? '').trim().toUpperCase()

    if (col0 === 'RIVAL') {
      const label = String(row[1] ?? '').toUpperCase()
      inFinal = label.includes('FINAL') || label.includes('TOTAL')
      continue
    }

    if (!inFinal) continue
    if (SKIP.includes(col0)) continue
    if (!row[0] || String(row[0]).trim() === '') continue

    const name = String(row[0]).trim()
    if (name.toUpperCase().startsWith('JUGADORA') || name.toUpperCase() === '%') continue

    result.push({
      name,
      minutes: parseNum(row[1]),
      passesOk: parseNum(row[2]),
      passesFail: parseNum(row[3]),
      shotsOk: parseNum(row[5]),
      shotsFail: parseNum(row[6]),
      dribblesOk: parseNum(row[8]),
      dribblesFail: parseNum(row[9]),
      duelsOk: parseNum(row[11]),
      duelsFail: parseNum(row[12]),
      recovOk: parseNum(row[14]),
      recovFail: parseNum(row[15]),
      losses: parseNum(row[17]),
      offside: parseNum(row[18]),
      goals: parseNum(row[19]),
      assists: parseNum(row[20]),
    })
  }
  return result
}

export default function ImportarPage() {
  const router = useRouter()
  const [step, setStep] = useState<'form' | 'preview' | 'importing' | 'done'>('form')
  const [rival, setRival] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [location, setLocation] = useState('')
  const [result, setResult] = useState('')
  const [isHome, setIsHome] = useState(true)
  const [veoUrl, setVeoUrl] = useState('')
  const [players, setPlayers] = useState<PlayerRow[]>([])
  const [error, setError] = useState('')

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const wb = XLSX.read(ev.target?.result, { type: 'array' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: '' })
        const parsed = parseSheet(rows as unknown[][])
        if (parsed.length === 0) {
          setError('No se encontraron datos en la sección FINAL del Excel. Verifica el formato.')
          return
        }
        setPlayers(parsed)
        if (!rival && rows[1]?.[0]) setRival(String(rows[1][0]))
      } catch {
        setError('Error al leer el archivo. Asegúrate de que es un .xlsx válido.')
      }
    }
    reader.readAsArrayBuffer(file)
  }

  async function handleImport() {
    setStep('importing')
    setError('')
    try {
      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rival, date, location, result, isHome, veoUrl, players }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error al importar')
      setStep('done')
      setTimeout(() => router.push(`/partidos/${data.matchId}`), 1500)
    } catch (err) {
      setError((err as Error).message)
      setStep('preview')
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-white">Importar partido</h1>

      {step === 'done' && (
        <div className="bg-emerald-500/20 border border-emerald-500/40 rounded-xl p-6 text-center">
          <div className="text-4xl mb-2">✅</div>
          <p className="text-emerald-400 font-semibold">¡Partido importado correctamente!</p>
          <p className="text-slate-400 text-sm mt-1">Redirigiendo...</p>
        </div>
      )}

      {step === 'importing' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-center">
          <div className="text-4xl mb-2 animate-spin">⚙️</div>
          <p className="text-white">Importando datos...</p>
        </div>
      )}

      {(step === 'form' || step === 'preview') && (
        <>
          {/* Match info */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 space-y-3">
            <h2 className="font-semibold text-white">Datos del partido</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Rival *</label>
                <input value={rival} onChange={(e) => setRival(e.target.value)} placeholder="Nombre del rival"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500" />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Fecha *</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500" />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Resultado (ej: 2-1)</label>
                <input value={result} onChange={(e) => setResult(e.target.value)} placeholder="2-1"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500" />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Campo</label>
                <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Ciudad Deportiva..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500" />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">¿Partido en casa?</label>
                <select value={isHome ? 'yes' : 'no'} onChange={(e) => setIsHome(e.target.value === 'yes')}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500">
                  <option value="yes">Casa</option>
                  <option value="no">Fuera</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">URL Veo (opcional)</label>
                <input value={veoUrl} onChange={(e) => setVeoUrl(e.target.value)} placeholder="https://app.veo.co/..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500" />
              </div>
            </div>
          </div>

          {/* File upload */}
          {step === 'form' && (
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-4">
              <h2 className="font-semibold text-white mb-3">Archivo Excel de estadísticas</h2>
              <label className="block border-2 border-dashed border-slate-700 rounded-xl p-8 text-center cursor-pointer hover:border-emerald-500/50 transition-colors">
                <input type="file" accept=".xlsx,.xls" onChange={handleFile} className="hidden" />
                <div className="text-3xl mb-2">📊</div>
                <p className="text-slate-300 text-sm">Haz clic para seleccionar el Excel</p>
                <p className="text-slate-500 text-xs mt-1">Formato: el mismo Excel que usas actualmente</p>
              </label>
              {error && <p className="text-red-400 text-sm mt-2 bg-red-400/10 rounded-lg px-3 py-2">{error}</p>}
            </div>
          )}

          {/* Preview */}
          {step === 'preview' && players.length > 0 && (
            <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <h2 className="font-semibold text-white">{players.length} jugadoras detectadas</h2>
                <button onClick={() => setStep('form')} className="text-slate-400 hover:text-white text-sm">Cambiar archivo</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="text-left px-3 py-2">Jugadora</th>
                      <th className="text-center px-2 py-2">Min</th>
                      <th className="text-center px-2 py-2">Pases</th>
                      <th className="text-center px-2 py-2">Tiros</th>
                      <th className="text-center px-2 py-2">⚽</th>
                      <th className="text-center px-2 py-2">🎯</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {players.map((p, i) => (
                      <tr key={i}>
                        <td className="px-3 py-2 text-white">{p.name}</td>
                        <td className="px-2 py-2 text-center text-slate-300">{p.minutes || '—'}</td>
                        <td className="px-2 py-2 text-center text-slate-300">{p.passesOk}/{p.passesOk + p.passesFail}</td>
                        <td className="px-2 py-2 text-center text-slate-300">{p.shotsOk}/{p.shotsOk + p.shotsFail}</td>
                        <td className="px-2 py-2 text-center text-emerald-400">{p.goals || '—'}</td>
                        <td className="px-2 py-2 text-center text-yellow-400">{p.assists || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {error && <p className="text-red-400 text-sm p-3 bg-red-400/10">{error}</p>}
              <div className="p-4">
                <button
                  onClick={handleImport}
                  disabled={!rival || !date}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
                >
                  Importar {players.length} jugadoras
                </button>
                {(!rival || !date) && <p className="text-slate-500 text-xs text-center mt-2">Completa el nombre del rival y la fecha</p>}
              </div>
            </div>
          )}

          {players.length > 0 && step === 'form' && (
            <div className="flex justify-end">
              <button onClick={() => setStep('preview')}
                className="bg-emerald-500 hover:bg-emerald-400 text-white font-medium px-6 py-2 rounded-xl transition-colors">
                Ver previsualización →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

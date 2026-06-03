'use client'
import { Download } from 'lucide-react'

type Row = Record<string, string | number | null>

export default function ExportButton({
  data, filename, label,
}: {
  data: Row[]
  filename: string
  label?: string
}) {
  async function handleExport() {
    const xlsx = await import('xlsx')
    const ws = xlsx.utils.json_to_sheet(data)
    const wb = xlsx.utils.book_new()
    xlsx.utils.book_append_sheet(wb, ws, 'Stats')
    xlsx.writeFile(wb, `${filename}.xlsx`)
  }

  return (
    <button
      onClick={handleExport}
      className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg text-sm transition-colors"
    >
      <Download size={14} />
      {label ?? 'Exportar Excel'}
    </button>
  )
}

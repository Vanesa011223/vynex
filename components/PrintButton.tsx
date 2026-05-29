'use client'
import { Printer } from 'lucide-react'

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="flex items-center gap-2 text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 px-3 py-1.5 rounded-lg text-sm transition-colors print:hidden"
    >
      <Printer size={14} /> Exportar PDF
    </button>
  )
}

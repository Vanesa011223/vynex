'use client'
import { useActionState, useState } from 'react'
import { addNotice, deleteNotice } from '@/app/actions/notices'
import { Bell, Plus, Trash2, AlertTriangle, Megaphone } from 'lucide-react'

type Notice = {
  id: string
  title: string
  content: string
  priority: string
  createdAt: string
  expiresAt: string | null
}

export default function AvisosClient({ notices, isAdmin }: { notices: Notice[]; isAdmin: boolean }) {
  const [showForm, setShowForm] = useState(false)
  const [addState, addAction, addPending] = useActionState(addNotice, undefined)
  const [delState, delAction] = useActionState(deleteNotice, undefined)

  return (
    <div className="space-y-4">
      {isAdmin && (
        <>
          {!showForm ? (
            <button onClick={() => setShowForm(true)}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              <Plus size={16} /> Nuevo aviso
            </button>
          ) : (
            <form action={async (fd) => { await addAction(fd); setShowForm(false) }}
              className="bg-slate-900 border border-slate-700 rounded-2xl p-4 space-y-3">
              <h3 className="font-semibold text-white">Nuevo aviso</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2">
                  <label className="text-xs text-slate-400 mb-1 block">Título *</label>
                  <input name="title" required placeholder="ej. Entrenamiento cancelado"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs text-slate-400 mb-1 block">Contenido *</label>
                  <textarea name="content" required rows={3} placeholder="Escribe el mensaje aquí..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm resize-none focus:outline-none focus:border-emerald-500" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Prioridad</label>
                  <select name="priority" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500">
                    <option value="normal">Normal</option>
                    <option value="urgent">Urgente</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Caduca el (opcional)</label>
                  <input name="expiresAt" type="date"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500" />
                </div>
              </div>
              {addState?.error && <p className="text-red-400 text-sm">{addState.error}</p>}
              <div className="flex gap-2">
                <button type="submit" disabled={addPending}
                  className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                  {addPending ? 'Publicando...' : 'Publicar aviso'}
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  className="text-slate-400 hover:text-white px-4 py-2 rounded-lg text-sm transition-colors">
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </>
      )}

      {notices.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <Bell size={40} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium">Sin avisos activos</p>
          {isAdmin && <p className="text-sm mt-1">Crea un aviso para que lo vea todo el equipo</p>}
        </div>
      ) : (
        <div className="space-y-3">
          {notices.map(n => (
            <div key={n.id} className={`border rounded-2xl p-5 ${
              n.priority === 'urgent'
                ? 'bg-red-500/10 border-red-500/30'
                : 'bg-slate-900 border-slate-800'
            }`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                  <div className={`mt-0.5 flex-shrink-0 ${n.priority === 'urgent' ? 'text-red-400' : 'text-slate-400'}`}>
                    {n.priority === 'urgent' ? <AlertTriangle size={18} /> : <Megaphone size={18} />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-white">{n.title}</h3>
                      {n.priority === 'urgent' && (
                        <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full border border-red-500/30">Urgente</span>
                      )}
                    </div>
                    <p className="text-slate-300 text-sm mt-2 leading-relaxed">{n.content}</p>
                    <p className="text-slate-500 text-xs mt-2">
                      {new Date(n.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
                      {n.expiresAt && ` · Caduca el ${new Date(n.expiresAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}`}
                    </p>
                  </div>
                </div>
                {isAdmin && (
                  <form action={delAction} className="flex-shrink-0">
                    <input type="hidden" name="id" value={n.id} />
                    <button type="submit" className="text-slate-600 hover:text-red-400 transition-colors p-1">
                      <Trash2 size={15} />
                    </button>
                  </form>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

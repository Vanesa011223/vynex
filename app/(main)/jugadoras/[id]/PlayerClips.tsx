'use client'
import { useActionState, useState } from 'react'
import { addClip, deleteClip } from '@/app/actions/clips'
import { Plus, Video, ExternalLink, Trash2, Film } from 'lucide-react'

type Clip = {
  id: string
  title: string
  url: string
  description: string | null
  createdAt: string
}

function getYoutubeThumbnail(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  return match ? `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg` : null
}

function getDomain(url: string): string {
  try { return new URL(url).hostname.replace('www.', '') } catch { return 'enlace' }
}

export default function PlayerClips({
  clips,
  playerId,
  isAdmin,
}: {
  clips: Clip[]
  playerId: string
  isAdmin: boolean
}) {
  const [showForm, setShowForm] = useState(false)
  const [addState, addAction, addPending] = useActionState(addClip, undefined)
  const [delState, delAction] = useActionState(deleteClip, undefined)

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Film size={16} className="text-slate-400" />
          <h2 className="font-semibold text-white">Clips de vídeo</h2>
          {clips.length > 0 && <span className="text-xs text-slate-500">({clips.length})</span>}
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            <Plus size={14} /> Añadir clip
          </button>
        )}
      </div>

      {isAdmin && showForm && (
        <form
          action={async (fd) => { await addAction(fd); setShowForm(false) }}
          className="p-4 border-b border-slate-800 space-y-3 bg-slate-800/30"
        >
          <input type="hidden" name="playerId" value={playerId} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Título *</label>
              <input
                name="title"
                required
                placeholder="ej. Gol vs Atlético (jornada 5)"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">URL del vídeo *</label>
              <input
                name="url"
                required
                type="url"
                placeholder="https://veo.co/... o youtube.com/..."
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs text-slate-400 mb-1 block">Descripción (opcional)</label>
              <input
                name="description"
                placeholder="ej. Minuto 67, gran definición individual..."
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
          {addState?.error && <p className="text-red-400 text-sm">{addState.error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={addPending} className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              {addPending ? 'Guardando...' : 'Guardar clip'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white px-4 py-2 rounded-lg text-sm transition-colors">
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="p-4">
        {clips.length === 0 ? (
          <div className="text-center py-8 text-slate-600">
            <Video size={28} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">Sin clips añadidos</p>
            {isAdmin && <p className="text-xs mt-1">Añade clips de Veo, YouTube u otras plataformas</p>}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {clips.map(clip => {
              const thumb = getYoutubeThumbnail(clip.url)
              const domain = getDomain(clip.url)
              return (
                <div key={clip.id} className="bg-slate-800 rounded-xl overflow-hidden group">
                  {thumb ? (
                    <div className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={thumb} alt={clip.title} className="w-full h-28 object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <a href={clip.url} target="_blank" rel="noopener noreferrer"
                          className="bg-white/20 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5">
                          <ExternalLink size={12} /> Ver en YouTube
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="h-20 bg-slate-700/50 flex items-center justify-center">
                      <Video size={24} className="text-slate-500" />
                    </div>
                  )}
                  <div className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{clip.title}</p>
                        {clip.description && <p className="text-slate-400 text-xs mt-0.5 line-clamp-2">{clip.description}</p>}
                        <a
                          href={clip.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 mt-1.5 transition-colors"
                        >
                          <ExternalLink size={11} /> {domain}
                        </a>
                      </div>
                      {isAdmin && (
                        <form action={delAction} className="flex-shrink-0">
                          <input type="hidden" name="id" value={clip.id} />
                          <input type="hidden" name="playerId" value={playerId} />
                          <button type="submit" className="text-slate-600 hover:text-red-400 transition-colors p-1">
                            <Trash2 size={14} />
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

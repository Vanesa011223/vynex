'use client'
import { useActionState } from 'react'
import { updateProfile, changePassword } from '@/app/actions/players'
import { User, Lock, Check } from 'lucide-react'

type UserData = {
  id: string; name: string; email: string; role: string
  position: string | null; number: number | null
}

const ROLE_LABELS: Record<string, string> = { ADMIN: 'Administrador', COACH: 'Entrenador/a', PLAYER: 'Jugadora' }

export default function ProfileClient({ user }: { user: UserData }) {
  const [profileState, profileAction, profilePending] = useActionState(updateProfile, undefined)
  const [passState, passAction, passPending] = useActionState(changePassword, undefined)

  return (
    <div className="space-y-5">
      {/* Info card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center text-2xl font-bold text-emerald-400">
            {user.name.charAt(0)}
          </div>
          <div>
            <p className="text-white font-semibold text-lg">{user.name}</p>
            <p className="text-slate-400 text-sm">{user.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700">
                {ROLE_LABELS[user.role] ?? user.role}
              </span>
              {user.position && <span className="text-xs text-slate-400">{user.position}</span>}
              {user.number && <span className="text-xs text-slate-400">#{user.number}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Change name */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <User size={16} className="text-slate-400" />
          <h2 className="font-semibold text-white text-sm">Cambiar nombre</h2>
        </div>
        <form action={profileAction} className="space-y-3">
          <input name="name" defaultValue={user.name} required
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500" />
          {profileState?.error && <p className="text-red-400 text-sm">{profileState.error}</p>}
          {profileState?.success && <p className="text-emerald-400 text-sm flex items-center gap-1"><Check size={14} /> Nombre actualizado</p>}
          <button type="submit" disabled={profilePending}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            {profilePending ? 'Guardando...' : 'Guardar nombre'}
          </button>
        </form>
      </div>

      {/* Change password */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Lock size={16} className="text-slate-400" />
          <h2 className="font-semibold text-white text-sm">Cambiar contraseña</h2>
        </div>
        <form action={passAction} className="space-y-3">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Contraseña actual</label>
            <input name="current" type="password" required
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500" />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Nueva contraseña</label>
            <input name="new" type="password" required minLength={6}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500" />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Confirmar nueva contraseña</label>
            <input name="confirm" type="password" required
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500" />
          </div>
          {passState?.error && <p className="text-red-400 text-sm">{passState.error}</p>}
          {passState?.success && <p className="text-emerald-400 text-sm flex items-center gap-1"><Check size={14} /> Contraseña cambiada correctamente</p>}
          <button type="submit" disabled={passPending}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            {passPending ? 'Cambiando...' : 'Cambiar contraseña'}
          </button>
        </form>
      </div>
    </div>
  )
}

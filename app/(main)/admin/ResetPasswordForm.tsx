'use client'
import { useActionState, useState } from 'react'
import { resetPassword } from '@/app/actions/players'

export default function ResetPasswordForm({ userId, userName }: { userId: string; userName: string }) {
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState(resetPassword, undefined)

  if (state?.success) {
    return <span className="text-emerald-400 text-xs">Contraseña actualizada</span>
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-xs text-slate-400 hover:text-yellow-400 transition-colors">
        Resetear contraseña
      </button>
    )
  }

  return (
    <form action={action} className="flex items-center gap-2">
      <input type="hidden" name="userId" value={userId} />
      <input
        name="password"
        type="password"
        placeholder="Nueva contraseña"
        required
        minLength={6}
        className="bg-slate-700 border border-slate-600 rounded-lg px-2 py-1 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-36"
      />
      <button type="submit" disabled={pending}
        className="bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 text-black text-xs font-medium px-3 py-1 rounded-lg transition-colors">
        {pending ? '...' : 'Guardar'}
      </button>
      <button type="button" onClick={() => setOpen(false)} className="text-slate-500 hover:text-white text-xs">
        Cancelar
      </button>
      {state?.error && <span className="text-red-400 text-xs">{state.error}</span>}
    </form>
  )
}

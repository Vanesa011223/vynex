'use client'
import { useActionState, useState } from 'react'
import { deleteUser } from '@/app/actions/players'

export default function DeleteUserButton({ userId, userName }: { userId: string; userName: string }) {
  const [confirm, setConfirm] = useState(false)
  const [state, action, pending] = useActionState(deleteUser, undefined)

  if (!confirm) {
    return (
      <button
        onClick={() => setConfirm(true)}
        className="text-xs text-slate-500 hover:text-red-400 transition-colors"
      >
        Eliminar
      </button>
    )
  }

  return (
    <form action={action} className="flex items-center gap-2">
      <input type="hidden" name="userId" value={userId} />
      <span className="text-xs text-slate-400">¿Eliminar a {userName}?</span>
      <button
        type="submit"
        disabled={pending}
        className="bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-medium px-3 py-1 rounded-lg transition-colors"
      >
        {pending ? '...' : 'Sí, eliminar'}
      </button>
      <button
        type="button"
        onClick={() => setConfirm(false)}
        className="text-slate-500 hover:text-white text-xs"
      >
        Cancelar
      </button>
      {state?.error && <span className="text-red-400 text-xs">{state.error}</span>}
    </form>
  )
}

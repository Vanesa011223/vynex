'use client'
import { useActionState } from 'react'
import { addStaff } from '@/app/actions/players'

export default function AddStaffForm() {
  const [state, action, pending] = useActionState(addStaff, undefined)

  return (
    <form action={action} className="p-4 border-b border-slate-800 bg-slate-800/30">
      <p className="text-sm text-slate-400 mb-3 font-medium">Añadir miembro del cuerpo técnico</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <input name="name" placeholder="Nombre *" required
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-500" />
        <input name="email" type="email" placeholder="Email *" required
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-500" />
        <div className="flex gap-2">
          <input name="password" type="password" placeholder="Contraseña (mín 6 caracteres)" required
            className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-500" />
          <button type="submit" disabled={pending}
            className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors whitespace-nowrap">
            {pending ? '...' : 'Añadir'}
          </button>
        </div>
      </div>
      {state?.error && <p className="text-red-400 text-xs mt-2">{state.error}</p>}
      {state?.success && <p className="text-emerald-400 text-xs mt-2">¡Cuenta creada!</p>}
    </form>
  )
}

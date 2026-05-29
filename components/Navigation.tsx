'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, Trophy, Settings, LogOut, Calendar, Bot, Target, Dumbbell, BookOpen, BarChart2, Bell, Euro } from 'lucide-react'
import { logout } from '@/app/actions/auth'

const publicLinks = [
  { href: '/dashboard', label: 'Inicio', icon: LayoutDashboard },
  { href: '/jugadoras', label: 'Jugadoras', icon: Users },
  { href: '/partidos', label: 'Partidos', icon: Trophy },
  { href: '/calendario', label: 'Calendario', icon: Calendar },
  { href: '/avisos', label: 'Avisos', icon: Bell },
  { href: '/estadisticas', label: 'Stats', icon: BarChart2 },
]

const adminLinks = [
  { href: '/vaynex', label: 'Vaynex', icon: Bot },
  { href: '/rivales', label: 'Rivales', icon: Target },
  { href: '/entrenamientos', label: 'Entrenos', icon: Dumbbell },
  { href: '/ejercicios', label: 'Ejercicios', icon: BookOpen },
  { href: '/admin/multas', label: 'Multas', icon: Euro },
  { href: '/admin', label: 'Admin', icon: Settings },
]

export default function Navigation({ role }: { role: string }) {
  const pathname = usePathname()
  const isAdmin = role === 'ADMIN' || role === 'COACH'

  const allLinks = isAdmin ? [...publicLinks, ...adminLinks] : publicLinks

  return (
    <>
      {/* Top bar - desktop */}
      <header className="hidden md:flex fixed top-0 left-0 right-0 h-16 bg-slate-900 border-b border-slate-800 items-center px-6 z-50">
        <div className="flex items-center gap-2 mr-8">
          <span className="text-2xl">⚽</span>
          <span className="font-bold text-white">Dashboard</span>
        </div>
        <nav className="flex items-center gap-1 flex-1">
          {allLinks.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href)
            const isVAYNEX = href === '/vaynex'
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? isVAYNEX ? 'bg-violet-600/20 text-violet-400' : 'bg-emerald-500/20 text-emerald-400'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon size={16} />
                {label}
              </Link>
            )
          })}
        </nav>
        <form action={logout}>
          <button
            type="submit"
            className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors"
          >
            <LogOut size={16} />
            Salir
          </button>
        </form>
      </header>

      {/* Bottom bar - mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 z-50">
        <div className="flex items-center justify-around py-2">
          {allLinks.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href)
            const isVAYNEX = href === '/vaynex'
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center gap-1 px-2 py-1.5 rounded-lg transition-colors ${
                  active
                    ? isVAYNEX ? 'text-violet-400' : 'text-emerald-400'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <Icon size={20} />
                <span className="text-xs">{label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}

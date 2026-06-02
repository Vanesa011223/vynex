'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import {
  LayoutDashboard, Users, Trophy, Settings, LogOut, Calendar,
  Bot, Target, Dumbbell, BookOpen, BarChart2, Bell, Euro,
  ChevronDown, MoreHorizontal, X, Wrench,
} from 'lucide-react'
import { logout } from '@/app/actions/auth'

const mainLinks = [
  { href: '/dashboard',    label: 'Inicio',     icon: LayoutDashboard },
  { href: '/jugadoras',    label: 'Jugadoras',  icon: Users },
  { href: '/partidos',     label: 'Partidos',   icon: Trophy },
  { href: '/calendario',   label: 'Calendario', icon: Calendar },
  { href: '/avisos',       label: 'Avisos',     icon: Bell },
  { href: '/estadisticas', label: 'Stats',      icon: BarChart2 },
]

const adminLinks = [
  { href: '/vaynex',         label: 'VAYNEX',       icon: Bot,      vaynex: true },
  { href: '/rivales',        label: 'Rivales',      icon: Target },
  { href: '/entrenamientos', label: 'Entrenos',     icon: Dumbbell },
  { href: '/ejercicios',     label: 'Ejercicios',   icon: BookOpen },
  { href: '/admin/multas',   label: 'Multas',       icon: Euro },
  { href: '/admin',          label: 'Admin',        icon: Settings },
]

// Mobile: show only the 4 most important + "Más"
const mobileMain = mainLinks.slice(0, 4)

export default function Navigation({ role }: { role: string }) {
  const pathname = usePathname()
  const isAdmin = role === 'ADMIN' || role === 'COACH'
  const [toolsOpen, setToolsOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const toolsRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (toolsRef.current && !toolsRef.current.contains(e.target as Node)) {
        setToolsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Close dropdown on route change
  useEffect(() => { setToolsOpen(false); setMoreOpen(false) }, [pathname])

  const isAdminActive = isAdmin && adminLinks.some(l => pathname.startsWith(l.href))

  return (
    <>
      {/* ── Desktop top bar ── */}
      <header className="hidden md:flex fixed top-0 left-0 right-0 h-16 bg-slate-900 border-b border-slate-800 items-center px-6 z-50">
        <div className="flex items-center gap-2 mr-8 flex-shrink-0">
          <span className="text-2xl">⚽</span>
          <span className="font-bold text-white">VAYNEX</span>
        </div>

        <nav className="flex items-center gap-1 flex-1 flex-wrap">
          {mainLinks.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
            return (
              <Link key={href} href={href}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  active ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}>
                <Icon size={15} />
                {label}
              </Link>
            )
          })}

          {/* Admin tools dropdown */}
          {isAdmin && (
            <div ref={toolsRef} className="relative">
              <button
                onClick={() => setToolsOpen(v => !v)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  toolsOpen || isAdminActive
                    ? 'bg-violet-600/20 text-violet-400'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Wrench size={15} />
                Herramientas
                <ChevronDown size={14} className={`transition-transform ${toolsOpen ? 'rotate-180' : ''}`} />
              </button>

              {toolsOpen && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50">
                  {adminLinks.map(({ href, label, icon: Icon, vaynex }) => {
                    const active = pathname.startsWith(href)
                    return (
                      <Link key={href} href={href}
                        className={`flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${
                          active
                            ? vaynex ? 'bg-violet-600/20 text-violet-400' : 'bg-emerald-500/10 text-emerald-400'
                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        }`}>
                        <Icon size={15} className={vaynex && !active ? 'text-violet-400' : ''} />
                        {label}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </nav>

        <form action={logout} className="flex-shrink-0">
          <button type="submit"
            className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors">
            <LogOut size={16} />
            Salir
          </button>
        </form>
      </header>

      {/* ── Mobile bottom bar ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 z-50">
        <div className="flex items-center justify-around py-2">
          {mobileMain.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
            return (
              <Link key={href} href={href}
                className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-colors ${
                  active ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'
                }`}>
                <Icon size={20} />
                <span className="text-xs">{label}</span>
              </Link>
            )
          })}

          {/* Más button */}
          <button
            onClick={() => setMoreOpen(true)}
            className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-colors ${
              moreOpen ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'
            }`}>
            <MoreHorizontal size={20} />
            <span className="text-xs">Más</span>
          </button>
        </div>
      </nav>

      {/* ── Mobile "Más" drawer ── */}
      {moreOpen && (
        <>
          <div className="md:hidden fixed inset-0 bg-black/60 z-50" onClick={() => setMoreOpen(false)} />
          <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 rounded-t-2xl z-50 pb-safe">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
              <span className="font-semibold text-white text-sm">Navegación</span>
              <button onClick={() => setMoreOpen(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <div className="p-3 space-y-1">
              {/* Secondary public links */}
              {mainLinks.slice(4).map(({ href, label, icon: Icon }) => {
                const active = pathname.startsWith(href)
                return (
                  <Link key={href} href={href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                      active ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}>
                    <Icon size={18} />
                    {label}
                  </Link>
                )
              })}

              {isAdmin && (
                <>
                  <div className="pt-2 pb-1 px-3">
                    <span className="text-xs text-slate-500 font-medium uppercase tracking-wide">Herramientas</span>
                  </div>
                  {adminLinks.map(({ href, label, icon: Icon, vaynex }) => {
                    const active = pathname.startsWith(href)
                    return (
                      <Link key={href} href={href}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                          active
                            ? vaynex ? 'bg-violet-600/20 text-violet-400' : 'bg-emerald-500/20 text-emerald-400'
                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        }`}>
                        <Icon size={18} className={vaynex && !active ? 'text-violet-400' : ''} />
                        {label}
                      </Link>
                    )
                  })}
                </>
              )}

              <div className="pt-2">
                <form action={logout}>
                  <button type="submit"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-slate-800 w-full transition-colors">
                    <LogOut size={18} />
                    Cerrar sesión
                  </button>
                </form>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}

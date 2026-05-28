'use client'
import { useActionState, useState } from 'react'
import { addCalendarEvent, deleteCalendarEvent } from '@/app/actions/calendar'

type CalEvent = {
  id: string
  date: string
  type: string
  title: string
  objectives: string | null
  notes: string | null
}

type Props = {
  year: number
  month: number
  events: CalEvent[]
  isAdmin: boolean
  weekMessage: string
}

const TYPE_STYLES: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  entrenamiento: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', dot: 'bg-emerald-500', label: 'Entrenamiento' },
  partido:       { bg: 'bg-blue-500/20',    text: 'text-blue-400',    dot: 'bg-blue-500',    label: 'Partido' },
  evento:        { bg: 'bg-yellow-500/20',  text: 'text-yellow-400',  dot: 'bg-yellow-500',  label: 'Evento' },
  descanso:      { bg: 'bg-slate-700/50',   text: 'text-slate-400',   dot: 'bg-slate-500',   label: 'Descanso' },
}

const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const DAY_NAMES = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom']

function getDaysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate() }
function getFirstDayOfWeek(y: number, m: number) { return (new Date(y, m, 1).getDay() + 6) % 7 }

export default function CalendarGrid({ year, month, events, isAdmin, weekMessage }: Props) {
  const [addState, addAction, addPending] = useActionState(addCalendarEvent, undefined)
  const [delState, delAction] = useActionState(deleteCalendarEvent, undefined)
  const [showForm, setShowForm] = useState(false)
  const [selectedDay, setSelectedDay] = useState<number | null>(null)

  const today = new Date()
  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfWeek(year, month)

  const eventsByDay: Record<number, CalEvent[]> = {}
  for (const ev of events) {
    const d = new Date(ev.date)
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate()
      if (!eventsByDay[day]) eventsByDay[day] = []
      eventsByDay[day].push(ev)
    }
  }

  const prevMonth = month === 0 ? { y: year - 1, m: 11 } : { y: year, m: month - 1 }
  const nextMonth = month === 11 ? { y: year + 1, m: 0 } : { y: year, m: month + 1 }

  const selectedEvents = selectedDay ? (eventsByDay[selectedDay] ?? []) : []

  return (
    <div className="space-y-4">
      {/* Week message */}
      {weekMessage && (
        <div className="bg-violet-600/10 border border-violet-500/20 rounded-2xl p-4">
          <p className="text-xs text-violet-400 font-medium mb-1">Mensaje del cuerpo técnico esta semana</p>
          <p className="text-slate-200 text-sm">{weekMessage}</p>
        </div>
      )}

      {/* Calendar */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
        {/* Month navigation */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <a href={`?y=${prevMonth.y}&m=${prevMonth.m}`} className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors">
            ←
          </a>
          <h2 className="font-semibold text-white">{MONTH_NAMES[month]} {year}</h2>
          <a href={`?y=${nextMonth.y}&m=${nextMonth.m}`} className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors">
            →
          </a>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-slate-800">
          {DAY_NAMES.map(d => (
            <div key={d} className="text-center text-xs text-slate-500 py-2 font-medium">{d}</div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7">
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[60px] border-b border-r border-slate-800/50" />
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1
            const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day
            const dayEvents = eventsByDay[day] ?? []
            const isSelected = selectedDay === day

            return (
              <button
                key={day}
                onClick={() => setSelectedDay(isSelected ? null : day)}
                className={`min-h-[60px] p-1.5 border-b border-r border-slate-800/50 text-left transition-colors hover:bg-slate-800/50 ${isSelected ? 'bg-slate-800' : ''}`}
              >
                <span className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1 ${isToday ? 'bg-emerald-500 text-white' : 'text-slate-400'}`}>
                  {day}
                </span>
                <div className="flex flex-wrap gap-0.5">
                  {dayEvents.slice(0, 3).map(ev => (
                    <span key={ev.id} className={`w-2 h-2 rounded-full ${TYPE_STYLES[ev.type]?.dot ?? 'bg-slate-500'}`} />
                  ))}
                  {dayEvents.length > 3 && <span className="text-slate-500 text-xs">+{dayEvents.length - 3}</span>}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {Object.entries(TYPE_STYLES).map(([type, s]) => (
          <div key={type} className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${s.dot}`} />
            <span className="text-xs text-slate-400">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Selected day detail */}
      {selectedDay && (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-white">{selectedDay} de {MONTH_NAMES[month]}</h3>
            {isAdmin && (
              <button onClick={() => setShowForm(v => !v)} className="text-xs text-emerald-400 hover:text-emerald-300">
                + Añadir evento
              </button>
            )}
          </div>

          {selectedEvents.length === 0 && !showForm && (
            <p className="text-slate-500 text-sm">Sin eventos este día</p>
          )}

          {selectedEvents.map(ev => (
            <div key={ev.id} className={`rounded-xl p-3 ${TYPE_STYLES[ev.type]?.bg ?? 'bg-slate-800'} border border-slate-700`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className={`text-sm font-medium ${TYPE_STYLES[ev.type]?.text ?? 'text-white'}`}>{ev.title}</p>
                  {ev.objectives && <p className="text-slate-300 text-xs mt-1">Objetivo: {ev.objectives}</p>}
                  {ev.notes && <p className="text-slate-400 text-xs mt-0.5">{ev.notes}</p>}
                </div>
                {isAdmin && (
                  <form action={delAction}>
                    <input type="hidden" name="id" value={ev.id} />
                    <button type="submit" className="text-slate-600 hover:text-red-400 text-xs transition-colors flex-shrink-0">✕</button>
                  </form>
                )}
              </div>
            </div>
          ))}

          {/* Add event form */}
          {isAdmin && showForm && (
            <form action={addAction} className="space-y-2 pt-2 border-t border-slate-800">
              <input type="hidden" name="date" value={`${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`} />
              <div className="grid grid-cols-2 gap-2">
                <select name="type" required className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500">
                  <option value="entrenamiento">Entrenamiento</option>
                  <option value="partido">Partido</option>
                  <option value="evento">Evento</option>
                  <option value="descanso">Descanso</option>
                </select>
                <input name="title" placeholder="Título *" required
                  className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-500" />
              </div>
              <input name="objectives" placeholder="Objetivos (opcional)"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-500" />
              <div className="flex gap-2">
                <input name="notes" placeholder="Notas adicionales"
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-500" />
                <button type="submit" disabled={addPending}
                  className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-lg transition-colors whitespace-nowrap">
                  {addPending ? '...' : 'Guardar'}
                </button>
              </div>
              {addState?.error && <p className="text-red-400 text-xs">{addState.error}</p>}
              {addState?.success && <p className="text-emerald-400 text-xs">Evento añadido</p>}
            </form>
          )}
        </div>
      )}
    </div>
  )
}

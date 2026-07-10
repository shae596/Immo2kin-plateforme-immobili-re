import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { fetchPropertyAvailability } from '../services/api/reservations'
import type { BlockedRange } from '../types/reservation'
import {
  addMonths,
  daysInMonth,
  isDateInRange,
  parseIsoDate,
  toIsoDate,
} from '../utils/dates'

interface PropertyAvailabilityCalendarProps {
  propertyId: number
  startDate: string
  endDate: string
  onSelectStart: (iso: string) => void
  onSelectEnd: (iso: string) => void
}

function isBlocked(date: Date, ranges: BlockedRange[]): boolean {
  return ranges.some((r) => isDateInRange(date, r.start_date, r.end_date))
}

function isPast(date: Date): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return date < today
}

const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

export function PropertyAvailabilityCalendar({
  propertyId,
  startDate,
  endDate,
  onSelectStart,
  onSelectEnd,
}: PropertyAvailabilityCalendarProps) {
  const today = new Date()
  const [view, setView] = useState({ year: today.getFullYear(), month: today.getMonth() })
  const [blocked, setBlocked] = useState<BlockedRange[]>([])
  const [loading, setLoading] = useState(true)

  const rangeFrom = useMemo(() => {
    const d = new Date(view.year, view.month, 1)
    return toIsoDate(d)
  }, [view])

  const rangeTo = useMemo(() => {
    const next = addMonths(view.year, view.month, 2)
    const d = new Date(next.year, next.month, 0)
    return toIsoDate(d)
  }, [view])

  useEffect(() => {
    setLoading(true)
    fetchPropertyAvailability(propertyId, rangeFrom, rangeTo)
      .then((data) => setBlocked(data.blocked_ranges))
      .catch(() => setBlocked([]))
      .finally(() => setLoading(false))
  }, [propertyId, rangeFrom, rangeTo])

  function handleDayClick(iso: string, disabled: boolean) {
    if (disabled) return

    if (!startDate || (startDate && endDate)) {
      onSelectStart(iso)
      onSelectEnd('')
      return
    }

    const start = parseIsoDate(startDate)
    const clicked = parseIsoDate(iso)

    if (clicked < start) {
      onSelectStart(iso)
      onSelectEnd('')
      return
    }

    onSelectEnd(iso)
  }

  function renderMonth(year: number, month: number) {
    const firstDow = (new Date(year, month, 1).getDay() + 6) % 7
    const total = daysInMonth(year, month)
    const cells: ReactNode[] = []

    for (let i = 0; i < firstDow; i++) {
      cells.push(<div key={`e-${i}`} className="h-9" />)
    }

    for (let day = 1; day <= total; day++) {
      const date = new Date(year, month, day)
      const iso = toIsoDate(date)
      const blockedDay = isBlocked(date, blocked)
      const past = isPast(date)
      const disabled = blockedDay || past
      const isStart = startDate === iso
      const isEnd = endDate === iso
      const inRange =
        startDate &&
        endDate &&
        isDateInRange(date, startDate, endDate)

      cells.push(
        <button
          key={iso}
          type="button"
          disabled={disabled}
          onClick={() => handleDayClick(iso, disabled)}
          className={`h-9 rounded text-sm ${
            disabled
              ? blockedDay
                ? 'cursor-not-allowed bg-red-50 text-red-300 line-through'
                : 'cursor-not-allowed text-slate-300'
              : 'hover:bg-emerald-50'
          } ${isStart || isEnd ? 'bg-emerald-600 font-semibold text-white hover:bg-emerald-700' : ''} ${
            inRange && !isStart && !isEnd ? 'bg-emerald-100 text-emerald-900' : ''
          }`}
        >
          {day}
        </button>,
      )
    }

    const monthLabel = new Date(year, month, 1).toLocaleDateString('fr-FR', {
      month: 'long',
      year: 'numeric',
    })

    return (
      <div key={`${year}-${month}`}>
        <p className="mb-2 text-center text-sm font-medium capitalize">{monthLabel}</p>
        <div className="mb-1 grid grid-cols-7 gap-1 text-center text-xs text-slate-500">
          {WEEKDAYS.map((w) => (
            <span key={w}>{w}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">{cells}</div>
      </div>
    )
  }

  const month2 = addMonths(view.year, view.month, 1)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <button
          type="button"
          className="rounded border border-slate-300 px-2 py-1 text-sm"
          onClick={() => setView((v) => addMonths(v.year, v.month, -1))}
        >
          ←
        </button>
        {loading && <span className="text-xs text-slate-500">Calendrier…</span>}
        <button
          type="button"
          className="rounded border border-slate-300 px-2 py-1 text-sm"
          onClick={() => setView((v) => addMonths(v.year, v.month, 1))}
        >
          →
        </button>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {renderMonth(view.year, view.month)}
        {renderMonth(month2.year, month2.month)}
      </div>
      <p className="text-xs text-slate-500">
        Jours barrés = indisponibles. Cliquez une date d&apos;arrivée puis de départ.
      </p>
    </div>
  )
}

import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { createReservation } from '../services/api/reservations'
import type { Property } from '../types/property'
import { formatPrice } from '../types/property'
import { authReturnPath } from '../utils/authRedirect'
import { getApiErrorMessage, getApiFieldErrors } from '../utils/apiErrors'
import { parseIsoDate } from '../utils/dates'
import { PropertyAvailabilityCalendar } from './PropertyAvailabilityCalendar'

interface ReservationFormProps {
  property: Property
}

function estimateTotal(monthlyPrice: string | number, start: string, end: string): number {
  if (!start || !end) return 0
  const s = parseIsoDate(start)
  const e = parseIsoDate(end)
  const nights = Math.max(1, Math.round((e.getTime() - s.getTime()) / 86400000) + 1)
  const monthly = typeof monthlyPrice === 'string' ? parseFloat(monthlyPrice) : monthlyPrice
  return Math.round((monthly / 30) * nights * 100) / 100
}

export function ReservationForm({ property }: ReservationFormProps) {
  const { isAuthenticated, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [guests, setGuests] = useState(1)
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})

  const isOwner = user?.id === property.owner?.id
  const estimated = estimateTotal(property.price, startDate, endDate)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!startDate || !endDate) {
      setError('Sélectionnez les dates sur le calendrier.')
      return
    }

    setSubmitting(true)
    setError(null)
    setFieldErrors({})

    try {
      await createReservation(property.id, {
        start_date: startDate,
        end_date: endDate,
        guests,
        message: message || undefined,
      })
      navigate('/reservations', {
        state: { message: 'Demande de réservation envoyée au propriétaire.' },
      })
    } catch (err) {
      setError(getApiErrorMessage(err, 'Réservation impossible.'))
      setFieldErrors(getApiFieldErrors(err))
    } finally {
      setSubmitting(false)
    }
  }

  if (property.listing_type !== 'rent') {
    return (
      <p className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        Ce bien est à vendre : contactez le propriétaire via WhatsApp pour organiser une visite.
      </p>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm">
        <p className="text-emerald-900">Connectez-vous pour réserver ce logement.</p>
        <Link
          to="/login"
          state={{
            from: authReturnPath(location.pathname, location.search, location.hash),
          }}
          className="mt-2 inline-block font-medium text-emerald-700 hover:underline"
        >
          Se connecter
        </Link>
      </div>
    )
  }

  if (isOwner) {
    return (
      <p className="text-sm text-slate-500">
        Vous êtes le propriétaire de cette annonce. Gérez les demandes dans{' '}
        <Link to="/my/properties/reservations" className="text-emerald-700 hover:underline">
          Réservations reçues
        </Link>
        .
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="text-lg font-semibold">Réserver ce logement</h2>
      <p className="text-sm text-slate-600">
        Loyer affiché : {formatPrice(property.price, property.currency)} / mois — estimation
        séjour :{' '}
        <strong>
          {estimated > 0 ? formatPrice(estimated, property.currency) : '—'}
        </strong>
      </p>

      <PropertyAvailabilityCalendar
        propertyId={property.id}
        startDate={startDate}
        endDate={endDate}
        onSelectStart={setStartDate}
        onSelectEnd={setEndDate}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="res-start" className="mb-1 block text-xs font-medium text-slate-600">
            Arrivée
          </label>
          <input
            id="res-start"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            required
          />
        </div>
        <div>
          <label htmlFor="res-end" className="mb-1 block text-xs font-medium text-slate-600">
            Départ
          </label>
          <input
            id="res-end"
            type="date"
            value={endDate}
            min={startDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            required
          />
        </div>
      </div>

      <div>
        <label htmlFor="res-guests" className="mb-1 block text-xs font-medium text-slate-600">
          Voyageurs
        </label>
        <input
          id="res-guests"
          type="number"
          min={1}
          max={20}
          value={guests}
          onChange={(e) => setGuests(Number(e.target.value))}
          className="w-full max-w-[120px] rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label htmlFor="res-message" className="mb-1 block text-xs font-medium text-slate-600">
          Message au propriétaire (optionnel)
        </label>
        <textarea
          id="res-message"
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          placeholder="Heure d'arrivée, questions…"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {Object.entries(fieldErrors).map(([field, msgs]) => (
        <p key={field} className="text-sm text-red-600">
          {msgs[0]}
        </p>
      ))}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-50 sm:w-auto"
      >
        {submitting ? 'Envoi…' : 'Envoyer la demande'}
      </button>
    </form>
  )
}

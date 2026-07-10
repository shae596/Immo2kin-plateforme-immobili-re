import { Link } from 'react-router-dom'
import type { Reservation } from '../types/reservation'
import {
  reservationStatusClass,
  reservationStatusLabel,
} from '../types/reservation'
import { formatPrice } from '../types/property'

interface ReservationCardProps {
  reservation: Reservation
  mode: 'guest' | 'owner'
  onConfirm?: (id: number) => void
  onReject?: (id: number) => void
  onCancel?: (id: number) => void
  onPay?: (reservation: Reservation) => void
  busyId?: number | null
}

export function ReservationCard({
  reservation,
  mode,
  onConfirm,
  onReject,
  onCancel,
  onPay,
  busyId = null,
}: ReservationCardProps) {
  const busy = busyId === reservation.id
  const isPaid = reservation.is_paid ?? Boolean(reservation.paid_at)
  const title =
    mode === 'guest'
      ? reservation.property?.title ?? `Annonce #${reservation.property_id}`
      : reservation.user?.name ?? `Client #${reservation.user_id}`

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <span
            className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${reservationStatusClass(reservation.status)}`}
          >
            {reservationStatusLabel(reservation.status)}
          </span>
          {isPaid && (
            <span className="ml-2 inline-block rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
              Payée
            </span>
          )}
          <h3 className="mt-2 font-semibold">{title}</h3>
          {mode === 'guest' && reservation.property && (
            <p className="text-sm text-slate-600">
              {reservation.property.commune}, {reservation.property.city}
            </p>
          )}
          {mode === 'owner' && reservation.user && (
            <p className="text-sm text-slate-600">
              {reservation.user.email ?? 'E-mail non renseigné'}
              {reservation.user.phone ? ` · ${reservation.user.phone}` : ''}
            </p>
          )}
        </div>
        <p className="text-right font-semibold text-emerald-700">
          {formatPrice(reservation.total_price, reservation.currency)}
        </p>
      </div>

      <dl className="mt-3 grid gap-1 text-sm text-slate-600 sm:grid-cols-2">
        <div>
          <dt className="inline font-medium text-slate-700">Du </dt>
          <dd className="inline">
            {reservation.start_date} au {reservation.end_date}
          </dd>
        </div>
        <div>
          <dt className="inline font-medium text-slate-700">Nuits : </dt>
          <dd className="inline">{reservation.nights}</dd>
        </div>
        {reservation.guests && (
          <div>
            <dt className="inline font-medium text-slate-700">Voyageurs : </dt>
            <dd className="inline">{reservation.guests}</dd>
          </div>
        )}
      </dl>

      {reservation.message && (
        <p className="mt-2 text-sm italic text-slate-500">&laquo; {reservation.message} &raquo;</p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {mode === 'guest' && reservation.property && (
          <Link
            to={`/properties/${reservation.property.id}`}
            className="text-sm text-emerald-700 hover:underline"
          >
            Voir l&apos;annonce
          </Link>
        )}

        {mode === 'guest' && reservation.can_review && reservation.property && (
          <Link
            to={`/properties/${reservation.property.id}#avis`}
            className="rounded-md bg-sky-700 px-3 py-1.5 text-sm text-white hover:bg-sky-800"
          >
            Laisser un avis
          </Link>
        )}

        {mode === 'owner' && reservation.status === 'pending' && (
          <>
            <button
              type="button"
              disabled={busy}
              onClick={() => onConfirm?.(reservation.id)}
              className="rounded-md bg-emerald-700 px-3 py-1.5 text-sm text-white hover:bg-emerald-800 disabled:opacity-50"
            >
              Confirmer
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => onReject?.(reservation.id)}
              className="rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50"
            >
              Refuser
            </button>
          </>
        )}

        {mode === 'guest' && reservation.status === 'confirmed' && !isPaid && (
          <button
            type="button"
            disabled={busy}
            onClick={() => onPay?.(reservation)}
            className="rounded-md bg-emerald-700 px-3 py-1.5 text-sm text-white hover:bg-emerald-800 disabled:opacity-50"
          >
            Payer
          </button>
        )}

        {(reservation.status === 'pending' || reservation.status === 'confirmed') && (
          <button
            type="button"
            disabled={busy}
            onClick={() => onCancel?.(reservation.id)}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50 disabled:opacity-50"
          >
            Annuler
          </button>
        )}
      </div>
    </article>
  )
}

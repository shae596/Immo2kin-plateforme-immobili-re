import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchProperty } from '../services/api/properties'
import { PropertyFormPage } from './PropertyFormPage'

export function PropertyEditPage() {
  const { id } = useParams<{ id: string }>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const propertyId = Number(id)

  const [property, setProperty] = useState<Awaited<
    ReturnType<typeof fetchProperty>
  > | null>(null)

  useEffect(() => {
    if (!propertyId) return
    fetchProperty(propertyId)
      .then(setProperty)
      .catch(() => setError('Annonce introuvable.'))
      .finally(() => setLoading(false))
  }, [propertyId])

  if (loading) return <p className="text-slate-500">Chargement…</p>
  if (error || !property) return <p className="text-red-600">{error ?? 'Erreur.'}</p>

  return (
    <div>
      <Link
        to={`/properties/${property.id}`}
        className="mb-4 inline-block text-sm text-emerald-700 hover:underline"
      >
        ← Retour à l&apos;annonce
      </Link>
      <PropertyFormPage property={property} />
    </div>
  )
}

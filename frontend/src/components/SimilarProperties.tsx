import { useEffect, useState } from 'react'
import { fetchSimilarProperties } from '../services/api/recommendations'
import type { Property } from '../types/property'
import { PropertyCard } from './PropertyCard'

interface SimilarPropertiesProps {
  propertyId: number
}

export function SimilarProperties({ propertyId }: SimilarPropertiesProps) {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetchSimilarProperties(propertyId)
      .then((result) => setProperties(result.data))
      .catch(() => setProperties([]))
      .finally(() => setLoading(false))
  }, [propertyId])

  if (loading) {
    return <p className="text-sm text-slate-500">Chargement des annonces similaires…</p>
  }

  if (properties.length === 0) {
    return null
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6">
      <h2 className="font-semibold">Annonces similaires</h2>
      <p className="mt-1 text-sm text-slate-600">
        Même quartier, type de bien et gamme de prix.
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {properties.map((property) => (
          <PropertyCard key={property.id} property={property} />
        ))}
      </div>
    </section>
  )
}

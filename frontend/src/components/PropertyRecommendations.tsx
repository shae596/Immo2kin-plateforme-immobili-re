import { useEffect, useState } from 'react'
import { fetchRecommendations } from '../services/api/recommendations'
import type { Property } from '../types/property'
import { PropertyCard } from './PropertyCard'

interface PropertyRecommendationsProps {
  title?: string
  limit?: number
}

export function PropertyRecommendations({
  title = 'Recommandé pour vous',
  limit = 8,
}: PropertyRecommendationsProps) {
  const [properties, setProperties] = useState<Property[]>([])
  const [personalized, setPersonalized] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRecommendations(limit)
      .then((result) => {
        setProperties(result.data)
        setPersonalized(result.meta.personalized)
      })
      .catch(() => setProperties([]))
      .finally(() => setLoading(false))
  }, [limit])

  if (loading) {
    return <p className="text-sm text-slate-500">Chargement des suggestions…</p>
  }

  if (properties.length === 0) {
    return null
  }

  return (
    <section className="space-y-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="section-title">{title}</h2>
          <p className="mt-1 text-sm text-slate-600">
            {personalized
              ? 'Basé sur vos consultations, favoris et réservations.'
              : 'Annonces populaires sur la plateforme.'}
          </p>
        </div>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {properties.map((property) => (
          <PropertyCard key={property.id} property={property} />
        ))}
      </div>
    </section>
  )
}

import type { Property } from './property'

export interface RecommendationsResponse {
  data: Property[]
  meta: {
    total: number
    personalized: boolean
    source: 'hybrid' | 'popular'
  }
}

export interface SimilarPropertiesResponse {
  data: Property[]
  meta: {
    property_id: number
    total: number
  }
}

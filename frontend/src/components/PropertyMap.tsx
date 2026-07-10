import L from 'leaflet'
import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Circle,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from 'react-leaflet'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import type { PropertyMapMarker } from '../types/property'
import { formatPrice, listingTypeLabel, propertyTypeLabel } from '../types/property'

import 'leaflet/dist/leaflet.css'

const defaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
})

L.Marker.prototype.options.icon = defaultIcon

const KINSHASA_CENTER: [number, number] = [-4.325, 15.3]
const DEFAULT_ZOOM = 12

export interface MapSearchArea {
  lat: number
  lng: number
  radiusKm: number
}

interface PropertyMapProps {
  markers: PropertyMapMarker[]
  className?: string
  searchArea?: MapSearchArea | null
  onLocationPick?: (lat: number, lng: number) => void
}

function MapRecenter({
  center,
  zoom,
}: {
  center: [number, number]
  zoom: number
}) {
  const map = useMap()

  useEffect(() => {
    map.setView(center, zoom)
  }, [center, zoom, map])

  return null
}

function MapClickHandler({
  onLocationPick,
}: {
  onLocationPick?: (lat: number, lng: number) => void
}) {
  useMapEvents({
    click(event) {
      onLocationPick?.(event.latlng.lat, event.latlng.lng)
    },
  })

  return null
}

export function PropertyMap({
  markers,
  className = '',
  searchArea = null,
  onLocationPick,
}: PropertyMapProps) {
  const points = markers
    .map((m) => ({
      marker: m,
      lat: parseFloat(m.latitude),
      lng: parseFloat(m.longitude),
    }))
    .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng))

  const center: [number, number] = searchArea
    ? [searchArea.lat, searchArea.lng]
    : points.length > 0
      ? [points[0].lat, points[0].lng]
      : KINSHASA_CENTER

  const zoom =
    searchArea !== null ? 13 : points.length === 1 ? 14 : DEFAULT_ZOOM

  return (
    <div className={`overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[var(--shadow-card)] ${className}`}>
      {onLocationPick && (
        <p className="border-b border-slate-100 bg-gradient-to-r from-brand-50/80 to-white px-4 py-2.5 text-xs font-medium text-slate-600">
          Cliquez sur la carte pour chercher les annonces autour de ce point (rayon par défaut
          10&nbsp;km).
        </p>
      )}
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom
        className="h-full min-h-[420px] w-full"
      >
        <MapRecenter center={center} zoom={zoom} />
        <MapClickHandler onLocationPick={onLocationPick} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {searchArea && (
          <Circle
            center={[searchArea.lat, searchArea.lng]}
            radius={searchArea.radiusKm * 1000}
            pathOptions={{ color: '#059669', fillColor: '#10b981', fillOpacity: 0.12 }}
          />
        )}
        {searchArea && (
          <Marker position={[searchArea.lat, searchArea.lng]}>
            <Popup>Zone de recherche</Popup>
          </Marker>
        )}
        {points.map(({ marker, lat, lng }) => (
          <Marker key={marker.id} position={[lat, lng]}>
            <Popup>
              <div className="min-w-[180px] space-y-1 text-sm">
                <p className="font-semibold">{marker.title}</p>
                <p className="text-emerald-700">
                  {formatPrice(marker.price, marker.currency)}
                  <span className="text-slate-500">
                    {' '}
                    · {listingTypeLabel(marker.listing_type)}
                  </span>
                </p>
                <p className="text-slate-600">
                  {propertyTypeLabel(marker.type)} — {marker.commune}, {marker.city}
                </p>
                <Link
                  to={`/properties/${marker.id}`}
                  className="inline-block font-medium text-emerald-700 hover:underline"
                >
                  Voir l&apos;annonce
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}

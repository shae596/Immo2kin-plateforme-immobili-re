import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { addFavorite, removeFavorite } from '../services/api/favorites'
import { authReturnPath } from '../utils/authRedirect'

interface FavoriteButtonProps {
  propertyId: number
  isFavorited: boolean
  onChange?: (propertyId: number, isFavorited: boolean) => void
}

export function FavoriteButton({
  propertyId,
  isFavorited: initialFavorited,
  onChange,
}: FavoriteButtonProps) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const navigate = useNavigate()
  const location = useLocation()
  const [isFavorited, setIsFavorited] = useState(initialFavorited)
  const [loading, setLoading] = useState(false)

  async function handleClick(event: React.MouseEvent) {
    event.preventDefault()
    event.stopPropagation()

    if (!isAuthenticated) {
      navigate('/login', {
        state: {
          from: authReturnPath(location.pathname, location.search, location.hash),
        },
      })
      return
    }

    if (loading) return
    setLoading(true)

    try {
      if (isFavorited) {
        await removeFavorite(propertyId)
        setIsFavorited(false)
        onChange?.(propertyId, false)
      } else {
        await addFavorite(propertyId)
        setIsFavorited(true)
        onChange?.(propertyId, true)
      }
    } catch {
      // silently fail — user can retry
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={(e) => void handleClick(e)}
      disabled={loading}
      aria-label={isFavorited ? 'Retirer des favoris' : 'Ajouter aux favoris'}
      className="rounded-full bg-white/90 p-2 shadow hover:bg-white disabled:opacity-50"
    >
      <span className={isFavorited ? 'text-red-500' : 'text-slate-400'}>
        {isFavorited ? '♥' : '♡'}
      </span>
    </button>
  )
}

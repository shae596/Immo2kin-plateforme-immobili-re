interface StarRatingProps {
  rating: number
  max?: number
  size?: 'sm' | 'md'
  interactive?: boolean
  onChange?: (rating: number) => void
}

export function StarRating({
  rating,
  max = 5,
  size = 'md',
  interactive = false,
  onChange,
}: StarRatingProps) {
  const sizeClass = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'

  return (
    <div className="inline-flex items-center gap-0.5" role={interactive ? 'radiogroup' : undefined}>
      {Array.from({ length: max }, (_, i) => {
        const value = i + 1
        const filled = value <= Math.round(rating)

        if (interactive) {
          return (
            <button
              key={value}
              type="button"
              onClick={() => onChange?.(value)}
              className={`${sizeClass} ${filled ? 'text-amber-400' : 'text-slate-300'} hover:text-amber-400`}
              aria-label={`${value} étoile${value > 1 ? 's' : ''}`}
            >
              <StarIcon filled={filled} />
            </button>
          )
        }

        return (
          <span
            key={value}
            className={`${sizeClass} ${filled ? 'text-amber-400' : 'text-slate-300'}`}
            aria-hidden
          >
            <StarIcon filled={filled} />
          </span>
        )
      })}
    </div>
  )
}

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-full w-full">
      {filled ? (
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      ) : (
        <path
          fillRule="evenodd"
          d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.052 2.52-2.64.055c-.9.019-1.255.958-.556 1.417l2.078 1.52-.782 2.565c-.269.882.695 1.613 1.453 1.074l2.165-1.51 2.165 1.51c.758.539 1.722-.192 1.453-1.074l-.782-2.565 2.078-1.52c.699-.46.345-1.398-.556-1.417l-2.64-.055-1.052-2.52z"
          clipRule="evenodd"
        />
      )}
    </svg>
  )
}

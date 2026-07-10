/** Taille max alignée sur StorePropertyImageRequest (10 Mo). */
export const MAX_PROPERTY_IMAGE_BYTES = 10 * 1024 * 1024

export const PROPERTY_IMAGE_ACCEPT =
  'image/jpeg,image/jpg,image/png,image/x-png,image/webp,.jpg,.jpeg,.png,.webp'

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/x-png',
  'image/webp',
])

const ALLOWED_EXTENSIONS = /\.(jpe?g|png|webp)$/i

export function validatePropertyImageFile(file: File): string | null {
  const hasAllowedMime = file.type !== '' && ALLOWED_MIME_TYPES.has(file.type)
  const hasAllowedExtension = ALLOWED_EXTENSIONS.test(file.name)

  if (!hasAllowedMime && !hasAllowedExtension) {
    return `"${file.name}" : format non accepté (JPG, PNG ou WebP uniquement).`
  }

  if (file.size > MAX_PROPERTY_IMAGE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1)
    return `"${file.name}" : ${sizeMb} Mo — maximum 10 Mo par photo.`
  }

  return null
}

export function validatePropertyImageFiles(files: File[]): string | null {
  for (const file of files) {
    const error = validatePropertyImageFile(file)
    if (error !== null) {
      return error
    }
  }

  return null
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} Ko`
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

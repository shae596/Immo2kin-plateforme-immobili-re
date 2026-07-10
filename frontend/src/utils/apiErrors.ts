const API_MESSAGE_FR: Record<string, string> = {
  'CSRF token mismatch.': 'Session expirée ou invalide. Rechargez la page puis réessayez.',
  'Unauthenticated.': 'Vous devez être connecté pour effectuer cette action.',
  'Non authentifié.': 'Vous devez être connecté pour effectuer cette action.',
  'The given data was invalid.': 'Les données envoyées sont invalides.',
  'Les données envoyées sont invalides.': 'Les données envoyées sont invalides.',
}

/** Clés Laravel non traduites (filet de sécurité côté frontend). */
const VALIDATION_KEY_FR: Record<string, string> = {
  'validation.required': 'Ce champ est obligatoire.',
  'validation.email': 'Adresse e-mail invalide.',
  'validation.confirmed': 'La confirmation ne correspond pas.',
  'validation.unique': 'Cette valeur est déjà utilisée.',
  'validation.min.string': 'Ce champ est trop court.',
  'validation.max.string': 'Ce champ est trop long.',
}

function translateApiMessage(message: string): string {
  const trimmed = message.trim()
  if (API_MESSAGE_FR[trimmed]) {
    return API_MESSAGE_FR[trimmed]
  }
  if (VALIDATION_KEY_FR[trimmed]) {
    return VALIDATION_KEY_FR[trimmed]
  }
  if (trimmed.startsWith('validation.')) {
    return 'Valeur invalide pour ce champ.'
  }
  return trimmed
}

function translateFieldErrors(errors: Record<string, string[]>): Record<string, string[]> {
  const translated: Record<string, string[]> = {}
  for (const [field, messages] of Object.entries(errors)) {
    translated[field] = messages.map(translateApiMessage)
  }
  return translated
}

export function getApiFieldErrors(error: unknown): Record<string, string[]> {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof (error as { response?: { data?: { errors?: Record<string, string[]> | null } } })
      .response?.data?.errors === 'object' &&
    (error as { response: { data: { errors: Record<string, string[]> | null } } }).response
      .data.errors !== null
  ) {
    return translateFieldErrors(
      (error as { response: { data: { errors: Record<string, string[]> } } }).response.data
        .errors,
    )
  }

  return {}
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  const fieldErrors = getApiFieldErrors(error)
  const firstFieldError = Object.values(fieldErrors).flat()[0]
  if (firstFieldError) {
    return firstFieldError
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof (error as { response?: { data?: { message?: string } } }).response?.data
      ?.message === 'string'
  ) {
    return translateApiMessage(
      (error as { response: { data: { message: string } } }).response.data.message,
    )
  }

  return fallback
}

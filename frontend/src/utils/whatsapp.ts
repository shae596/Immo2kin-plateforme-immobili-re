import { env } from '../config/env'

/**
 * Normalise un numéro pour wa.me (chiffres uniquement, indicatif pays requis).
 * Gère le format local RDC : 0XXXXXXXXX → 243XXXXXXXXX
 */
export function normalizePhoneForWhatsApp(phone: string): string | null {
  let digits = phone.replace(/\D/g, '')
  if (digits.length < 9) {
    return null
  }

  if (digits.startsWith('0') && digits.length === 10) {
    digits = `243${digits.slice(1)}`
  } else if (digits.length === 9 && !digits.startsWith('243')) {
    digits = `243${digits}`
  }

  return digits
}

export function buildWhatsAppUrl(phone: string, message: string): string | null {
  const normalized = normalizePhoneForWhatsApp(phone)
  if (!normalized) {
    return null
  }
  const text = encodeURIComponent(message)
  return `https://wa.me/${normalized}?text=${text}`
}

export function buildPropertyInquiryMessage(
  propertyTitle: string,
  propertyId: number,
): string {
  return (
    `Bonjour,\n\n` +
    `Je suis intéressé(e) par votre annonce « ${propertyTitle} » ` +
    `(réf. #${propertyId}) sur ${env.appName}.\n\n` +
    `Pourriez-vous me donner plus d'informations ou convenir d'une visite ?\n\n` +
    `Merci.`
  )
}

import type { Property } from '../types/property'
import {
  buildPropertyInquiryMessage,
  buildWhatsAppUrl,
} from '../utils/whatsapp'

interface OwnerContactCardProps {
  property: Property
}

export function OwnerContactCard({ property }: OwnerContactCardProps) {
  const owner = property.owner
  if (!owner) {
    return null
  }

  const phone = owner.phone?.trim()
  const whatsappUrl =
    phone != null && phone !== ''
      ? buildWhatsAppUrl(
          phone,
          buildPropertyInquiryMessage(property.title, property.id),
        )
      : null

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6">
      <h2 className="font-semibold">Contacter le propriétaire</h2>
      <div className="mt-1 flex flex-wrap items-center gap-2">
        <p className="text-sm text-slate-600">{owner.name}</p>
      </div>
      {(owner.city || owner.commune) && (
        <p className="text-xs text-slate-500">
          {[owner.commune, owner.city].filter(Boolean).join(', ')}
        </p>
      )}

      {whatsappUrl ? (
        <div className="mt-4 space-y-3">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-md bg-[#25D366] px-4 py-3 text-sm font-medium text-white shadow-sm hover:bg-[#20BD5A]"
          >
            <WhatsAppIcon />
            Contacter sur WhatsApp
          </a>
          <p className="text-xs text-slate-500">
            Un message prérempli s&apos;ouvrira avec les détails de cette annonce.
            Réponse habituelle sous 24 h.
          </p>
          {phone && (
            <p className="text-xs text-slate-400">
              Tél. :{' '}
              <a href={`tel:${phone}`} className="text-slate-600 hover:underline">
                {phone}
              </a>
            </p>
          )}
        </div>
      ) : (
        <p className="mt-3 text-sm text-amber-800">
          Ce propriétaire n&apos;a pas encore renseigné de numéro WhatsApp.
          Connectez-vous ou consultez votre tableau de bord si vous êtes le
          propriétaire.
        </p>
      )}
    </div>
  )
}

function WhatsAppIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-5 w-5"
      aria-hidden
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.882 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

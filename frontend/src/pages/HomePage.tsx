import { Link, useNavigate } from 'react-router-dom'
import {
  CalendarIcon,
  HeartIcon,
  KeyIcon,
  MapPinIcon,
  SearchIcon,
} from '../components/icons'
import { PropertyRecommendations } from '../components/PropertyRecommendations'
import { useAuthStore } from '../stores/authStore'
import { userCanManageProperties } from '../utils/authUser'

const FEATURES: Array<{
  title: string
  description: string
  href: string
  icon: typeof SearchIcon
  cta: string
  protected?: boolean
  ownerOnly?: boolean
}> = [
  {
    title: 'Parcourir',
    description: 'Filtres avancés et carte interactive pour trouver le bon bien.',
    href: '/properties',
    icon: SearchIcon,
    cta: 'Explorer',
  },
  {
    title: 'Réserver',
    description: 'Choisissez vos dates sur les annonces à louer en quelques clics.',
    href: '/reservations',
    icon: CalendarIcon,
    cta: 'Mes réservations',
    protected: true,
  },
  {
    title: 'Favoris',
    description: 'Enregistrez les annonces qui vous intéressent pour les retrouver facilement.',
    href: '/favorites',
    icon: HeartIcon,
    cta: 'Mes favoris',
    protected: true,
  },
  {
    title: 'Publier',
    description: 'Compte propriétaire ou agence requis pour gérer vos biens.',
    href: '/my/properties',
    icon: KeyIcon,
    cta: 'Mes annonces',
    protected: true,
    ownerOnly: true,
  },
]

export function HomePage() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const user = useAuthStore((state) => state.user)
  const navigate = useNavigate()

  const canManage = userCanManageProperties(user)

  function goToProtected(path: string) {
    if (isAuthenticated) {
      navigate(path)
      return
    }
    navigate('/login', { state: { from: path } })
  }

  return (
    <div className="space-y-12">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-800 via-brand-700 to-teal-600 px-6 py-12 text-white shadow-xl md:px-12 md:py-16">
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-20 left-1/4 h-48 w-48 rounded-full bg-teal-300/20 blur-3xl"
          aria-hidden
        />
        <div className="relative max-w-2xl space-y-6">
          <span className="badge inline-flex bg-white/15 text-white ring-1 ring-white/25">
            Immobilier intelligent · Kinshasa
          </span>
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">
            Trouvez votre prochain logement à Kinshasa
          </h1>
          <p className="text-lg leading-relaxed text-emerald-50/90">
            Annonces vérifiées, carte interactive, favoris et réservations en ligne —
            tout pour simplifier votre recherche immobilière.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link to="/properties" className="btn-primary bg-white text-brand-800 hover:bg-emerald-50">
              <SearchIcon className="h-4 w-4" />
              Voir les annonces
            </Link>
            <Link
              to="/properties/map"
              className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
            >
              <MapPinIcon className="h-4 w-4" />
              Ouvrir la carte
            </Link>
            {!isAuthenticated && (
              <Link
                to="/register"
                className="btn-secondary border-white/20 bg-transparent text-white hover:bg-white/10"
              >
                Créer un compte
              </Link>
            )}
          </div>
        </div>
        <dl className="relative mt-10 grid grid-cols-3 gap-4 border-t border-white/20 pt-8 md:max-w-lg">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wider text-emerald-100/80">
              Annonces
            </dt>
            <dd className="mt-1 text-2xl font-bold">Live</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wider text-emerald-100/80">
              Communes
            </dt>
            <dd className="mt-1 text-2xl font-bold">7+</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wider text-emerald-100/80">
              Réservation
            </dt>
            <dd className="mt-1 text-2xl font-bold">En ligne</dd>
          </div>
        </dl>
      </section>

      <PropertyRecommendations
        title={isAuthenticated ? 'Recommandé pour vous' : 'Annonces populaires'}
      />

      <section className="space-y-6">
        <div>
          <h2 className="section-title">Tout ce dont vous avez besoin</h2>
          <p className="mt-1 text-slate-600">
            Une expérience complète pour locataires, acheteurs et propriétaires.
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature) => {
            const Icon = feature.icon
            const isOwnerCard = feature.ownerOnly
            const title = isOwnerCard && canManage ? 'Gérer' : feature.title
            const description =
              isOwnerCard && canManage
                ? 'Annonces, demandes de réservation et vérification de vos biens.'
                : feature.description

            return (
              <article
                key={feature.title}
                className="card-surface group flex flex-col p-6 transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)]"
              >
                <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-brand-100 transition group-hover:bg-brand-100">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="font-bold text-slate-900">{title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">
                  {description}
                </p>
                {isOwnerCard && canManage ? (
                  <div className="mt-4 flex flex-col gap-1.5 text-sm font-semibold text-brand-700">
                    <button
                      type="button"
                      onClick={() => navigate('/my/properties')}
                      className="text-left hover:underline"
                    >
                      Mes annonces →
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate('/my/properties/reservations')}
                      className="text-left hover:underline"
                    >
                      Demandes reçues →
                    </button>
                  </div>
                ) : feature.protected ? (
                  <button
                    type="button"
                    onClick={() => goToProtected(feature.href)}
                    className="mt-4 text-left text-sm font-semibold text-brand-700 hover:underline"
                  >
                    {feature.cta} →
                  </button>
                ) : (
                  <Link
                    to={feature.href}
                    className="mt-4 text-sm font-semibold text-brand-700 hover:underline"
                  >
                    {feature.cta} →
                  </Link>
                )}
              </article>
            )
          })}
        </div>
      </section>
    </div>
  )
}

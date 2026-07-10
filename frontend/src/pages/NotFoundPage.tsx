import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="py-16 text-center">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="mt-2 text-slate-600">Page introuvable</p>
      <Link
        to="/"
        className="mt-6 inline-block text-emerald-700 hover:underline"
      >
        Retour à l&apos;accueil
      </Link>
    </div>
  )
}

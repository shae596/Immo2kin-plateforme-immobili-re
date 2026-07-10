import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { startPropertyConversation } from '../services/api/conversations'
import { getApiErrorMessage } from '../utils/apiErrors'

interface PropertyMessageFormProps {
  propertyId: number
  propertyTitle: string
}

export function PropertyMessageForm({ propertyId, propertyTitle }: PropertyMessageFormProps) {
  const navigate = useNavigate()
  const [body, setBody] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (body.trim() === '') return

    setBusy(true)
    setError(null)
    try {
      const result = await startPropertyConversation(propertyId, body.trim())
      navigate(`/messages?id=${result.conversation.id}`)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Impossible d\'envoyer le message.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="font-semibold">Message sur la plateforme</h3>
      <p className="mt-1 text-sm text-slate-600">
        Écrivez au propriétaire de « {propertyTitle} » sans quitter le site.
      </p>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <form onSubmit={handleSubmit} className="mt-3 space-y-3">
        <textarea
          rows={3}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Bonjour, je suis intéressé par cette annonce…"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={busy || body.trim() === ''}
            className="rounded-md bg-emerald-700 px-4 py-2 text-sm text-white hover:bg-emerald-800 disabled:opacity-50"
          >
            {busy ? 'Envoi…' : 'Envoyer un message'}
          </button>
          <Link to="/messages" className="rounded-md border px-4 py-2 text-sm hover:bg-slate-50">
            Mes messages
          </Link>
        </div>
      </form>
    </div>
  )
}

import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { echo } from '../lib/echo'
import { useAuthStore } from '../stores/authStore'
import {
  fetchConversations,
  fetchMessages,
  markConversationRead,
  sendConversationMessage,
} from '../services/api/conversations'
import type { ChatMessage, Conversation } from '../types/conversation'
import { getApiErrorMessage } from '../utils/apiErrors'

function formatTime(iso: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(iso))
}

export function MessagesPage() {
  const user = useAuthStore((state) => state.user)
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedId = Number(searchParams.get('id') || 0) || null

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [draft, setDraft] = useState('')
  const [loadingList, setLoadingList] = useState(true)
  const [loadingChat, setLoadingChat] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  const loadConversations = useCallback(async () => {
    setLoadingList(true)
    try {
      const result = await fetchConversations()
      setConversations(result.data)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Impossible de charger les conversations.'))
    } finally {
      setLoadingList(false)
    }
  }, [])

  const loadMessages = useCallback(async (conversationId: number) => {
    setLoadingChat(true)
    try {
      const result = await fetchMessages(conversationId)
      setMessages(result.data)
      await markConversationRead(conversationId)
      setConversations((prev) =>
        prev.map((c) => (c.id === conversationId ? { ...c, unread_count: 0 } : c)),
      )
    } catch (err) {
      setError(getApiErrorMessage(err, 'Impossible de charger les messages.'))
    } finally {
      setLoadingChat(false)
    }
  }, [])

  useEffect(() => {
    void loadConversations()
  }, [loadConversations])

  useEffect(() => {
    if (!selectedId) {
      setMessages([])
      return
    }
    void loadMessages(selectedId)
  }, [selectedId, loadMessages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (!selectedId || !user) return

    const channel = echo.private(`conversation.${selectedId}`)

    channel.listen('.message.sent', (payload: { message: ChatMessage }) => {
      const incoming = payload.message
      setMessages((prev) => {
        if (prev.some((m) => m.id === incoming.id)) return prev
        return [...prev, incoming]
      })

      if (incoming.user_id !== user.id) {
        void markConversationRead(selectedId)
      }

      void loadConversations()
    })

    return () => {
      channel.stopListening('.message.sent')
      echo.leave(`conversation.${selectedId}`)
    }
  }, [selectedId, user, loadConversations])

  const activeConversation = conversations.find((c) => c.id === selectedId) ?? null

  async function handleSend(event: React.FormEvent) {
    event.preventDefault()
    if (!selectedId || draft.trim() === '') return

    setSending(true)
    setError(null)
    try {
      const sent = await sendConversationMessage(selectedId, draft.trim())
      setMessages((prev) => (prev.some((m) => m.id === sent.id) ? prev : [...prev, sent]))
      setDraft('')
      void loadConversations()
    } catch (err) {
      setError(getApiErrorMessage(err, 'Envoi impossible.'))
    } finally {
      setSending(false)
    }
  }

  function selectConversation(id: number) {
    setSearchParams({ id: String(id) })
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Messages</h1>
        <p className="mt-1 text-sm text-slate-600">
          Échangez avec les propriétaires ou les clients intéressés par vos annonces.
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="grid min-h-[28rem] gap-4 lg:grid-cols-[18rem_1fr]">
        <aside className="rounded-lg border border-slate-200 bg-white">
          <div className="border-b px-4 py-3 text-sm font-medium text-slate-700">Conversations</div>
          {loadingList && <p className="p-4 text-sm text-slate-500">Chargement…</p>}
          {!loadingList && conversations.length === 0 && (
            <p className="p-4 text-sm text-slate-500">
              Aucune conversation. Contactez un propriétaire depuis une{' '}
              <Link to="/properties" className="text-emerald-700 hover:underline">
                annonce
              </Link>
              .
            </p>
          )}
          <ul className="divide-y">
            {conversations.map((conversation) => (
              <li key={conversation.id}>
                <button
                  type="button"
                  onClick={() => selectConversation(conversation.id)}
                  className={`w-full px-4 py-3 text-left hover:bg-slate-50 ${
                    selectedId === conversation.id ? 'bg-emerald-50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-slate-900">
                      {conversation.other_participant?.name ?? 'Conversation'}
                    </p>
                    {conversation.unread_count > 0 && (
                      <span className="rounded-full bg-emerald-700 px-2 py-0.5 text-xs text-white">
                        {conversation.unread_count}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">{conversation.property?.title}</p>
                  {conversation.latest_message && (
                    <p className="mt-1 truncate text-xs text-slate-600">
                      {conversation.latest_message.body}
                    </p>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <section className="flex flex-col rounded-lg border border-slate-200 bg-white">
          {!activeConversation && (
            <div className="flex flex-1 items-center justify-center p-8 text-sm text-slate-500">
              Sélectionnez une conversation.
            </div>
          )}

          {activeConversation && (
            <>
              <div className="border-b px-4 py-3">
                <p className="font-medium">{activeConversation.other_participant?.name}</p>
                <p className="text-xs text-slate-500">
                  {activeConversation.property?.title} · {activeConversation.property?.commune},{' '}
                  {activeConversation.property?.city}
                </p>
                {activeConversation.property && (
                  <Link
                    to={`/properties/${activeConversation.property.id}`}
                    className="text-xs text-emerald-700 hover:underline"
                  >
                    Voir l&apos;annonce
                  </Link>
                )}
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {loadingChat && <p className="text-sm text-slate-500">Chargement des messages…</p>}
                {messages.map((message) => {
                  const mine = message.user_id === user?.id
                  return (
                    <div
                      key={message.id}
                      className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                          mine
                            ? 'bg-emerald-700 text-white'
                            : 'bg-slate-100 text-slate-900'
                        }`}
                      >
                        <p>{message.body}</p>
                        <p
                          className={`mt-1 text-[10px] ${
                            mine ? 'text-emerald-100' : 'text-slate-500'
                          }`}
                        >
                          {formatTime(message.created_at)}
                        </p>
                      </div>
                    </div>
                  )
                })}
                <div ref={bottomRef} />
              </div>

              <form onSubmit={handleSend} className="border-t p-4">
                <div className="flex gap-2">
                  <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="Votre message…"
                    className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
                  />
                  <button
                    type="submit"
                    disabled={sending || draft.trim() === ''}
                    className="rounded-md bg-emerald-700 px-4 py-2 text-sm text-white disabled:opacity-50"
                  >
                    {sending ? 'Envoi…' : 'Envoyer'}
                  </button>
                </div>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  )
}

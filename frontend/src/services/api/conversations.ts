import type {
  ChatMessage,
  Conversation,
  PaginatedConversations,
  PaginatedMessages,
} from '../../types/conversation'
import { initCsrfCookie } from './csrf'
import { apiClient } from './client'

export async function fetchConversations(page = 1): Promise<PaginatedConversations> {
  await initCsrfCookie()
  const { data } = await apiClient.get<PaginatedConversations>('/v1/conversations', {
    params: { page },
  })
  return data
}

export async function fetchConversation(id: number): Promise<Conversation> {
  await initCsrfCookie()
  const { data } = await apiClient.get<{ conversation: Conversation }>(
    `/v1/conversations/${id}`,
  )
  return data.conversation
}

export async function fetchMessages(
  conversationId: number,
  page = 1,
): Promise<PaginatedMessages> {
  await initCsrfCookie()
  const { data } = await apiClient.get<PaginatedMessages>(
    `/v1/conversations/${conversationId}/messages`,
    { params: { page } },
  )
  return data
}

export async function startPropertyConversation(
  propertyId: number,
  body: string,
): Promise<{ conversation: Conversation; chat_message: ChatMessage }> {
  await initCsrfCookie()
  const { data } = await apiClient.post<{
    conversation: Conversation
    chat_message: ChatMessage
  }>(`/v1/properties/${propertyId}/conversations`, { body })
  return data
}

export async function sendConversationMessage(
  conversationId: number,
  body: string,
): Promise<ChatMessage> {
  await initCsrfCookie()
  const { data } = await apiClient.post<{ chat_message: ChatMessage }>(
    `/v1/conversations/${conversationId}/messages`,
    { body },
  )
  return data.chat_message
}

export async function markConversationRead(conversationId: number): Promise<void> {
  await initCsrfCookie()
  await apiClient.post(`/v1/conversations/${conversationId}/read`)
}

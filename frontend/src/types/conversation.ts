export interface ConversationParticipant {
  id: number
  name: string
  email?: string
}

export interface ConversationPropertySummary {
  id: number
  title: string
  city: string
  commune: string
}

export interface ChatMessage {
  id: number
  conversation_id: number
  user_id: number
  body: string
  read_at: string | null
  created_at: string
  user?: ConversationParticipant
}

export interface Conversation {
  id: number
  property_id: number
  client_id: number
  owner_id: number
  last_message_at: string | null
  unread_count: number
  property?: ConversationPropertySummary
  client?: ConversationParticipant
  owner?: ConversationParticipant
  other_participant?: ConversationParticipant | null
  latest_message?: ChatMessage | null
  created_at?: string
}

export interface PaginatedConversations {
  data: Conversation[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
    unread_total: number
  }
}

export interface PaginatedMessages {
  data: ChatMessage[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

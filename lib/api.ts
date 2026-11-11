// All calls to the backend live in this file.

const API_URL = process.env.NEXT_PUBLIC_API_URL

export type User = {
  id: number
  full_name: string
  email: string
  role: string
}

export type ToolCall = {
  name: string
  args: unknown
  result: unknown
}

type LoginResponse = {
  token: string
  thread_id: string
  user: User
}

type ChatResponse = {
  reply: string
  tool_calls: ToolCall[]
  intent?: string // what the patient was asking about, e.g. "clinic_question"
  judge_reason?: string // a short note on why
  // Set (both) when the reply was rewritten. new_response is the same as reply.
  rejected_response?: string | null
  new_response?: string | null
}

// One row in the sidebar. The title is empty until the chat has one.
export type ChatSummary = {
  thread_id: string
  title: string
  unfinished: boolean
  updated_at: string
}

// One saved question and answer. ai_answer is empty if the assistant never replied.
export type SavedMessage = {
  question: string
  ai_answer: string
  message_sent_at: string
}

type OpenedChat = {
  thread_id: string
  title: string
  messages: SavedMessage[]
}

// Thrown when the backend answers 401 (wrong password or expired session).
export class UnauthorizedError extends Error {}

async function request<T>(
  method: "GET" | "POST",
  path: string,
  token?: string,
  body?: object
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      ...(body && { "Content-Type": "application/json" }),
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: body && JSON.stringify(body),
  })

  if (response.status === 401) {
    throw new UnauthorizedError()
  }
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`)
  }
  return response.json()
}

export function login(email: string, password: string) {
  return request<LoginResponse>("POST", "/login", undefined, { email, password })
}

export function sendChatMessage(token: string, message: string) {
  return request<ChatResponse>("POST", "/chat", token, { message })
}

// The patient's chats, most recent first.
export function listChats(token: string) {
  return request<ChatSummary[]>("GET", "/chats", token)
}

// Start a new chat. The next message goes into it.
export function newChat(token: string) {
  return request<{ thread_id: string }>("POST", "/chats", token)
}

// Open an old chat. The next message carries on from where it left off.
export function openChat(token: string, threadId: string) {
  return request<OpenedChat>(
    "POST",
    `/chats/${encodeURIComponent(threadId)}/open`,
    token
  )
}

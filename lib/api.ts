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
}

// Thrown when the backend answers 401 (wrong password or expired session).
export class UnauthorizedError extends Error {}

async function post<T>(path: string, body: object, token?: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify(body),
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
  return post<LoginResponse>("/login", { email, password })
}

export function sendChatMessage(token: string, message: string) {
  return post<ChatResponse>("/chat", { message }, token)
}

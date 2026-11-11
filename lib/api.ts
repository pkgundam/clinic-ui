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
  // True when the agent paused for the front desk. The real answer comes later.
  waiting_for_approval: boolean
}

// One row in the sidebar. The title is empty until the chat has one.
export type ChatSummary = {
  thread_id: string
  title: string
  unfinished: boolean
  updated_at: string
}

// One saved question and answer. ai_answer is null until the assistant replies.
export type SavedMessage = {
  question: string
  ai_answer: string | null
  message_sent_at: string
}

type OpenedChat = {
  thread_id: string
  title: string
  messages: SavedMessage[]
  waiting_for_approval: boolean // the front desk still has to check something
}

// What the front desk sees about a request, so it doesn't have to read ids.
// starts_at is an ISO time. details is null if the slot or booking wasn't found.
export type BookingDetails = {
  doctor_name: string
  speciality: string
  starts_at: string
  starts_at_display: string
  reason: string | null
}

export type EmailDetails = BookingDetails & {
  booking_code: string
  subject: string
}

// One booking or email waiting for the front desk.
export type Approval = {
  id: number
  patient_name: string
  created_at: string
} & (
  | {
      tool_name: "book_appointment"
      args: Record<string, unknown>
      details: BookingDetails | null
    }
  | {
      tool_name: "send_email"
      args: Record<string, unknown>
      details: EmailDetails | null
    }
)

export type Decision = "approve" | "edit" | "reject"

type DecideResponse = {
  reply: string
  waiting_for_approval: boolean
}

// Thrown when the backend answers 401 (wrong password or expired session).
export class UnauthorizedError extends Error {}

// Any other failed request. detail is the backend's message, e.g.
// "This approval was already decided".
export class ApiError extends Error {
  constructor(
    public status: number,
    public detail: string
  ) {
    super(detail)
  }
}

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
    // FastAPI sends errors as {"detail": "..."}
    const data = await response.json().catch(() => null)
    const detail =
      typeof data?.detail === "string"
        ? data.detail
        : `Request failed with status ${response.status}`
    throw new ApiError(response.status, detail)
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

// A chat's messages, without making it the open one. Polled while we wait
// for the front desk.
export function getChatMessages(token: string, threadId: string) {
  return request<OpenedChat>(
    "GET",
    `/chats/${encodeURIComponent(threadId)}/messages`,
    token
  )
}

// Front desk only: everything waiting for a decision, oldest first.
export function listApprovals(token: string) {
  return request<Approval[]>("GET", "/admin/approvals", token)
}

// Front desk only: approve, edit (only the changed args) or reject (with a reason).
// It returns once the assistant has carried on, which takes a few seconds.
export function decideApproval(
  token: string,
  approvalId: number,
  decision: Decision,
  args: Record<string, string> | null = null,
  reason: string | null = null
) {
  return request<DecideResponse>(
    "POST",
    `/admin/approvals/${approvalId}/decide`,
    token,
    { decision, args, reason }
  )
}

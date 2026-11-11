import { useSyncExternalStore } from "react"

import type { User } from "@/lib/api"

// The login lives in sessionStorage, so it ends when the browser tab closes.
const TOKEN_KEY = "clinic_token"
const USER_KEY = "clinic_user"
const THREAD_KEY = "clinic_thread" // the chat that is open right now

export function saveSession(token: string, user: User, threadId: string) {
  sessionStorage.setItem(TOKEN_KEY, token)
  sessionStorage.setItem(USER_KEY, JSON.stringify(user))
  sessionStorage.setItem(THREAD_KEY, threadId)
}

export function getThreadId() {
  return sessionStorage.getItem(THREAD_KEY)
}

export function saveThreadId(threadId: string) {
  sessionStorage.setItem(THREAD_KEY, threadId)
}

export function getToken() {
  return sessionStorage.getItem(TOKEN_KEY)
}

// The signed-in patient, or null. The server has no sessionStorage, so it gets
// null first and React fills in the real value in the browser.
export function useUser(): User | null {
  const saved = useSyncExternalStore(
    () => () => {}, // nothing to subscribe to, the user only changes on login
    () => sessionStorage.getItem(USER_KEY),
    () => null
  )
  return saved ? JSON.parse(saved) : null
}

export function clearSession() {
  sessionStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(USER_KEY)
  sessionStorage.removeItem(THREAD_KEY)
}

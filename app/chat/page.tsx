"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { LoaderCircleIcon, StethoscopeIcon } from "lucide-react"

import {
  listChats,
  newChat,
  openChat,
  sendChatMessage,
  UnauthorizedError,
  type ChatSummary,
  type SavedMessage,
} from "@/lib/api"
import {
  clearSession,
  getThreadId,
  getToken,
  saveThreadId,
  useUser,
} from "@/lib/session"
import { AppSidebar } from "@/components/app-sidebar"
import { ChatHeader } from "@/components/chat-header"
import { ChatInput } from "@/components/chat-input"
import { ChatMessage, type ChatItem } from "@/components/chat-message"
import { Suggestions } from "@/components/suggestions"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@/components/ui/message-scroller"
import { Trace, TraceIcon, TraceLine, TraceTitle } from "@/components/ui/trace"

// Turn saved rows into messages: a question and, if there is one, its answer.
// The backend does not keep tool calls for old messages, so there are none to show.
function toChatItems(rows: SavedMessage[]): ChatItem[] {
  return rows.flatMap((row) => {
    const items: ChatItem[] = [
      { id: crypto.randomUUID(), role: "user", text: row.question },
    ]
    if (row.ai_answer) {
      items.push({
        id: crypto.randomUUID(),
        role: "assistant",
        text: row.ai_answer,
        toolCalls: [],
      })
    }
    return items
  })
}

export default function ChatPage() {
  const router = useRouter()
  const user = useUser()
  const [messages, setMessages] = useState<ChatItem[]>([])
  const [waiting, setWaiting] = useState(false) // waiting for a reply
  const [switching, setSwitching] = useState(false) // starting or opening a chat
  const [failedMessage, setFailedMessage] = useState<string | null>(null)
  const [chats, setChats] = useState<ChatSummary[]>([])
  const [threadId, setThreadId] = useState<string | null>(null) // the open chat
  const [switchError, setSwitchError] = useState<string | null>(null)

  // While the assistant is busy, the patient can't type or switch chats.
  const busy = waiting || switching

  function logout() {
    clearSession()
    router.replace("/login")
  }

  // Fetch the sidebar list. If it fails we keep the old list, it is not worth an error.
  async function loadChats() {
    const token = getToken()
    if (!token) return logout()
    try {
      setChats(await listChats(token))
    } catch (error) {
      if (error instanceof UnauthorizedError) logout()
    }
  }

  // Show the chosen chat's saved messages and make it the open one.
  async function openSavedChat(id: string) {
    const token = getToken()
    if (!token) return logout()

    setSwitchError(null)
    setSwitching(true)
    try {
      const chat = await openChat(token, id)
      saveThreadId(chat.thread_id)
      setThreadId(chat.thread_id)
      setMessages(toChatItems(chat.messages))
      setFailedMessage(null)
    } catch (error) {
      if (error instanceof UnauthorizedError) return logout()
      setSwitchError("Couldn't open that chat. Please try again.")
    } finally {
      setSwitching(false)
    }
  }

  async function startNewChat() {
    const token = getToken()
    if (!token) return logout()

    setSwitchError(null)
    setSwitching(true)
    try {
      const chat = await newChat(token)
      saveThreadId(chat.thread_id)
      setThreadId(chat.thread_id)
      setMessages([])
      setFailedMessage(null)
    } catch (error) {
      if (error instanceof UnauthorizedError) return logout()
      setSwitchError("Couldn't start a new chat. Please try again.")
    } finally {
      setSwitching(false)
    }
  }

  // When the page opens: no token means go to login. Otherwise load the chat
  // list, and if we were in a saved chat (page reload), show its messages again.
  useEffect(() => {
    async function start() {
      const token = getToken()
      if (!token) return router.replace("/login")

      const savedThreadId = getThreadId()
      setThreadId(savedThreadId)
      try {
        const list = await listChats(token)
        setChats(list)
        if (savedThreadId && list.some((c) => c.thread_id === savedThreadId)) {
          const chat = await openChat(token, savedThreadId)
          setMessages(toChatItems(chat.messages))
        }
      } catch (error) {
        if (error instanceof UnauthorizedError) {
          clearSession()
          router.replace("/login")
        }
      }
    }
    start()
  }, [router])

  // Ask the backend and add the reply. The patient's message is already on screen.
  async function getReply(text: string) {
    const token = getToken()
    if (!token) return logout()

    setFailedMessage(null)
    setWaiting(true)

    try {
      const data = await sendChatMessage(token, text)
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: data.reply,
          toolCalls: data.tool_calls,
        },
      ])
      loadChats() // a new chat shows up, and this one moves to the top
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        return logout() // The session expired.
      }
      setFailedMessage(text)
    } finally {
      setWaiting(false)
    }
  }

  function send(text: string) {
    setMessages((current) => [
      ...current,
      { id: crypto.randomUUID(), role: "user", text },
    ])
    getReply(text)
  }

  // Wait until we know who is signed in (it also avoids a flash of the chat).
  if (!user) return null

  const isEmpty = messages.length === 0

  return (
    <SidebarProvider className="h-dvh min-h-0">
      <AppSidebar
        chats={chats}
        activeThreadId={threadId}
        disabled={busy}
        onNewChat={startNewChat}
        onOpenChat={openSavedChat}
      />

      <SidebarInset className="min-h-0 min-w-0 overflow-hidden">
        <ChatHeader patientName={user.full_name} onLogout={logout} />

        <div className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1">
            {isEmpty ? (
              <Empty className="h-full">
                <EmptyHeader>
                  <EmptyMedia variant="icon" className="bg-accent text-primary">
                    <StethoscopeIcon />
                  </EmptyMedia>
                  <EmptyTitle>Hi {user.full_name}, how can I help?</EmptyTitle>
                  <EmptyDescription>
                    I can book appointments, check your next visit and answer
                    questions about our doctors and insurance.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <MessageScrollerProvider autoScroll>
                <MessageScroller>
                  <MessageScrollerViewport>
                    <MessageScrollerContent
                      aria-busy={waiting}
                      className="mx-auto w-full max-w-4xl px-4 py-6"
                    >
                      {messages.map((item) => (
                        <MessageScrollerItem
                          key={item.id}
                          messageId={item.id}
                          scrollAnchor={item.role === "user"}
                        >
                          <ChatMessage item={item} />
                        </MessageScrollerItem>
                      ))}

                      {waiting && (
                        <MessageScrollerItem messageId="thinking">
                          <Trace role="status">
                            <TraceLine status="running">
                              <TraceIcon>
                                <LoaderCircleIcon className="animate-spin" />
                              </TraceIcon>
                              <TraceTitle>Thinking…</TraceTitle>
                            </TraceLine>
                          </Trace>
                        </MessageScrollerItem>
                      )}

                      {failedMessage && (
                        <MessageScrollerItem messageId="error">
                          <div
                            role="alert"
                            className="flex flex-wrap items-center gap-3 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
                          >
                            Sorry, something went wrong on our side.
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => getReply(failedMessage)}
                            >
                              Try again
                            </Button>
                          </div>
                        </MessageScrollerItem>
                      )}
                    </MessageScrollerContent>
                  </MessageScrollerViewport>
                  <MessageScrollerButton />
                </MessageScroller>
              </MessageScrollerProvider>
            )}
          </div>

          <footer className="mx-auto flex w-full max-w-4xl flex-col gap-3 px-4 pt-2 pb-4">
            {switchError && (
              <p role="alert" className="text-sm text-destructive">
                {switchError}
              </p>
            )}
            {isEmpty && <Suggestions onPick={send} disabled={busy} />}
            <ChatInput onSend={send} disabled={busy} />
          </footer>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

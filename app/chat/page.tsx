"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { LoaderCircleIcon, StethoscopeIcon } from "lucide-react"

import { sendChatMessage, UnauthorizedError } from "@/lib/api"
import { clearSession, getToken, useUser } from "@/lib/session"
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
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@/components/ui/message-scroller"
import {
  Trace,
  TraceIcon,
  TraceLine,
  TraceTitle,
} from "@/components/ui/trace"

export default function ChatPage() {
  const router = useRouter()
  const user = useUser()
  const [messages, setMessages] = useState<ChatItem[]>([])
  const [waiting, setWaiting] = useState(false)
  const [failedMessage, setFailedMessage] = useState<string | null>(null)

  // No token? Go to the login page.
  useEffect(() => {
    if (!getToken()) router.replace("/login")
  }, [router])

  function logout() {
    clearSession()
    router.replace("/login")
  }

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
    <div className="flex h-dvh flex-col">
      <ChatHeader patientName={user.full_name} onLogout={logout} />

      <main className="min-h-0 flex-1">
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
      </main>

      <footer className="mx-auto flex w-full max-w-4xl flex-col gap-3 px-4 pt-2 pb-4">
        {isEmpty && <Suggestions onPick={send} disabled={waiting} />}
        <ChatInput onSend={send} disabled={waiting} />
      </footer>
    </div>
  )
}

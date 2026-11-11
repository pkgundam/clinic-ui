"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  ClipboardCheckIcon,
  InboxIcon,
  LogOutIcon,
} from "lucide-react"

import {
  ApiError,
  decideApproval,
  listApprovals,
  UnauthorizedError,
  type Approval,
  type Decision,
} from "@/lib/api"
import { POLL_MS } from "@/lib/config"
import { clearSession, getToken, getUser, useUser } from "@/lib/session"
import { ApprovalCard, type CardStatus } from "@/components/approval-card"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

// A card the front desk clicked on, with the request as it was then.
type Decided = { approval: Approval; status: CardStatus }

// Oldest first, like the backend.
function byCreated(a: Approval, b: Approval) {
  return (
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime() ||
    a.id - b.id
  )
}

export default function AdminPage() {
  const router = useRouter()
  const user = useUser()
  const [approvals, setApprovals] = useState<Approval[]>([]) // pending, from the backend
  const [decided, setDecided] = useState<Record<number, Decided>>({})
  const [loaded, setLoaded] = useState(false)
  const [offline, setOffline] = useState(false)
  const [now, setNow] = useState(0) // when we last loaded, for "3 min ago"

  function logout() {
    clearSession()
    router.replace("/login")
  }

  // Only the front desk may be here. Then load the list every few seconds.
  useEffect(() => {
    const token = getToken()
    if (!token) return router.replace("/login")
    if (getUser()?.role !== "admin") return router.replace("/chat")

    let stopped = false
    let timer: ReturnType<typeof setTimeout>

    async function load() {
      try {
        const list = await listApprovals(token!)
        if (stopped) return
        setApprovals(list)
        setNow(Date.now())
        setLoaded(true)
        setOffline(false)
      } catch (error) {
        if (error instanceof UnauthorizedError) {
          clearSession()
          return router.replace("/login")
        }
        if (error instanceof ApiError && error.status === 403) {
          return router.replace("/chat")
        }
        setOffline(true) // keep the old list and try again
      }
      if (!stopped) timer = setTimeout(load, POLL_MS)
    }

    load()
    return () => {
      stopped = true
      clearTimeout(timer)
    }
  }, [router])

  function setStatus(approval: Approval, status: CardStatus) {
    setDecided((current) => ({ ...current, [approval.id]: { approval, status } }))
  }

  function forget(id: number) {
    setDecided((current) => {
      const next = { ...current }
      delete next[id]
      return next
    })
  }

  async function decide(
    approval: Approval,
    decision: Decision,
    args: Record<string, string> | null,
    reason: string | null
  ) {
    const token = getToken()
    if (!token) return logout()

    setStatus(approval, { state: "deciding", decision })
    try {
      // Takes a few seconds: the assistant carries on in the patient's chat.
      await decideApproval(token, approval.id, decision, args, reason)
      setStatus(approval, { state: "done", decision, leaving: false })
      // A booking is often followed by its email: show that card right away.
      listApprovals(token).then(setApprovals, () => {})
      setTimeout(
        () => setStatus(approval, { state: "done", decision, leaving: true }),
        1800
      )
      setTimeout(() => forget(approval.id), 2300)
    } catch (error) {
      if (error instanceof UnauthorizedError) return logout()
      const message =
        error instanceof ApiError
          ? error.detail
          : "We couldn't reach the clinic. Please try again."
      setStatus(approval, { state: "error", message })
      // Someone else already decided it: show why, then let the card go.
      if (error instanceof ApiError && error.status === 409) {
        setTimeout(() => forget(approval.id), 4000)
      }
    }
  }

  if (!user) return null

  // The pending list, plus the cards we are deciding (the backend already dropped them).
  const shown = [
    ...approvals.filter((approval) => !decided[approval.id]),
    ...Object.values(decided).map((item) => item.approval),
  ].sort(byCreated)
  const waitingCount = approvals.filter((a) => !decided[a.id]).length

  return (
    <div className="flex h-dvh min-h-0 flex-col">
      <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-2 font-semibold">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <ClipboardCheckIcon className="size-4" />
          </span>
          <h1 className="truncate">
            Front desk <span className="text-muted-foreground">·</span>{" "}
            Approvals
          </h1>
          {waitingCount > 0 && (
            <span
              data-testid="approvals-count"
              className="shrink-0 rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground"
            >
              {waitingCount} waiting
            </span>
          )}
        </div>

        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate text-sm text-muted-foreground">
            {user.full_name}
          </span>
          <span className="shrink-0 rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground capitalize">
            {user.role}
          </span>
          <Button variant="outline" size="sm" onClick={logout}>
            <LogOutIcon />
            Log out
          </Button>
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto bg-muted/40">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-6 sm:px-6">
          <p className="text-sm text-muted-foreground">
            The assistant asks before it books an appointment or sends an
            email. Check each request.
          </p>

          {offline && (
            <p
              role="alert"
              className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              We can&apos;t reach the clinic right now. Trying again…
            </p>
          )}

          <section
            data-testid="approvals-list"
            aria-busy={!loaded}
            className="flex flex-col gap-4"
          >
            {shown.map((approval) => (
              <ApprovalCard
                key={approval.id}
                approval={approval}
                now={now}
                status={decided[approval.id]?.status}
                onDecide={(decision, args, reason) =>
                  decide(approval, decision, args, reason)
                }
              />
            ))}

            {loaded && shown.length === 0 && (
              <Empty
                data-testid="approvals-empty"
                className="rounded-2xl border bg-background py-16"
              >
                <EmptyHeader>
                  <EmptyMedia variant="icon" className="bg-accent text-primary">
                    <InboxIcon />
                  </EmptyMedia>
                  <EmptyTitle>No requests waiting.</EmptyTitle>
                  <EmptyDescription>
                    New bookings and emails show up here on their own.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}

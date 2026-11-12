"use client"

import { useState } from "react"
import {
  CalendarPlusIcon,
  CheckIcon,
  CircleAlertIcon,
  LoaderCircleIcon,
  MailIcon,
  PencilIcon,
  XIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"

import type { Approval, Decision } from "@/lib/api"
import { CLINIC_TIMEZONE } from "@/lib/config"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

// Where a card is: the page keeps this, because the card has to stay on screen
// while the assistant carries on (the backend already took it off the list).
export type CardStatus =
  | { state: "deciding"; decision: Decision }
  | { state: "done"; decision: Decision; leaving: boolean }
  | { state: "error"; message: string }

const TITLES = {
  book_appointment: "Book appointment",
  send_email: "Send confirmation email",
}

const WORKING = { approve: "Approving…", edit: "Saving…", reject: "Rejecting…" }
const DONE = { approve: "Approved", edit: "Edited", reject: "Rejected" }

// "2026-11-17T17:00:00+00:00" -> "Tue 17 Nov, 9:00 AM" (clinic time)
function clinicTime(iso: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: CLINIC_TIMEZONE,
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).formatToParts(new Date(iso))
  const part = (type: string) => parts.find((p) => p.type === type)?.value
  return `${part("weekday")} ${part("day")} ${part("month")}, ${part("hour")}:${part("minute")} ${part("dayPeriod")}`
}

// "just now", "3 min ago", "2 h ago"
function timeAgo(iso: string, now: number) {
  const minutes = Math.floor((now - new Date(iso).getTime()) / 60_000)
  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} h ago`
  return `${Math.floor(hours / 24)} d ago`
}

function Detail({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 font-medium break-words">{value}</dd>
    </>
  )
}

export function ApprovalCard({
  approval,
  now,
  status,
  onDecide,
}: {
  approval: Approval
  now: number // for "3 min ago"
  status?: CardStatus
  onDecide: (
    decision: Decision,
    args: Record<string, string> | null,
    reason: string | null
  ) => void
}) {
  // Which inline form is open: none, edit or reject.
  const [mode, setMode] = useState<"buttons" | "edit" | "reject">("buttons")
  const [text, setText] = useState("")

  const isEmail = approval.tool_name === "send_email"
  const details = approval.details
  const currentReason =
    details?.reason ?? String(approval.args.reason ?? "").trim()
  const deciding = status?.state === "deciding"
  const done = status?.state === "done"

  const typed = text.trim()
  // An edit of the booking must change the reason. A note and a reject reason must not be empty.
  const canConfirm =
    typed.length > 0 && !(mode === "edit" && !isEmail && typed === currentReason)

  function openForm(next: "edit" | "reject") {
    setText(next === "edit" && !isEmail ? currentReason : "")
    setMode(next)
  }

  function confirm() {
    if (!canConfirm) return
    if (mode === "edit") {
      // Only send what changes. The backend keeps the rest of the agent's arguments.
      onDecide("edit", isEmail ? { note: typed } : { reason: typed }, null)
    } else {
      onDecide("reject", null, typed)
    }
  }

  const field =
    mode === "reject"
      ? {
          id: `reject-${approval.id}`,
          testId: "reject-reason-input",
          label: "Reason",
          placeholder: "Why can't this go ahead?",
          hint: "The assistant passes this on to the patient.",
          confirm: "Reject",
        }
      : isEmail
        ? {
            id: `note-${approval.id}`,
            testId: "edit-note-input",
            label: "Note to the patient",
            placeholder: "Please bring your knee X-ray.",
            hint: "It is added to the email.",
            confirm: "Send with note",
          }
        : {
            id: `reason-${approval.id}`,
            testId: "edit-reason-input",
            label: "Reason for the visit",
            placeholder: "Knee pain after a fall",
            hint: "The booking is made with this reason.",
            confirm: "Book with this reason",
          }

  const Icon = isEmail ? MailIcon : CalendarPlusIcon

  return (
    <article
      data-testid="approval-card"
      data-approval-id={approval.id}
      data-tool={approval.tool_name}
      data-state={status?.state ?? "pending"}
      aria-busy={deciding}
      className={cn(
        "rounded-2xl border bg-card p-5 shadow-sm transition-all duration-500 animate-in fade-in slide-in-from-bottom-2",
        done && "border-emerald-200",
        status?.state === "done" &&
          status.leaving &&
          "-translate-y-1 scale-[0.98] opacity-0"
      )}
    >
      <header className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-primary">
          <Icon className="size-5" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <h2 className="text-base font-semibold">
            {TITLES[approval.tool_name]}
          </h2>
          <p className="text-sm text-muted-foreground">
            For <span className="text-foreground">{approval.patient_name}</span>{" "}
            · {timeAgo(approval.created_at, now)}
          </p>
        </div>
      </header>

      {details ? (
        <dl className="mt-4 grid grid-cols-[auto_minmax(0,1fr)] gap-x-6 gap-y-2 rounded-xl bg-muted px-4 py-3 text-sm">
          <Detail label="Doctor" value={details.doctor_name} />
          <Detail label="Speciality" value={details.speciality} />
          <Detail label="When" value={clinicTime(details.starts_at)} />
          <Detail label="Reason" value={details.reason} />
          {"booking_code" in details && (
            <>
              <Detail label="Booking code" value={details.booking_code} />
              <Detail label="Subject" value={details.subject} />
            </>
          )}
        </dl>
      ) : (
        <p className="mt-4 rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground">
          We couldn&apos;t find the details for this request.
        </p>
      )}

      <div className="mt-4">
        {done ? (
          <p
            data-testid="approval-status"
            role="status"
            className="flex items-center gap-2 text-sm font-medium text-emerald-700"
          >
            <CheckIcon className="size-4" />
            {DONE[status.decision]}
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {mode !== "buttons" && (
              <div className="flex flex-col gap-2">
                <Label htmlFor={field.id}>{field.label}</Label>
                <Textarea
                  id={field.id}
                  data-testid={field.testId}
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  placeholder={field.placeholder}
                  disabled={deciding}
                  autoFocus
                  rows={2}
                  className="min-h-0 resize-none bg-background md:text-sm"
                />
                <p className="text-sm text-muted-foreground">{field.hint}</p>
              </div>
            )}

            {status?.state === "error" && (
              <p
                data-testid="approval-status"
                role="alert"
                className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                <CircleAlertIcon className="size-4 shrink-0" />
                {status.message}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-2">
              {mode === "buttons" ? (
                <>
                  <Button
                    size="lg"
                    data-testid="approve-button"
                    disabled={deciding}
                    onClick={() => onDecide("approve", null, null)}
                  >
                    <CheckIcon />
                    Approve
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    data-testid="edit-button"
                    disabled={deciding}
                    onClick={() => openForm("edit")}
                  >
                    <PencilIcon />
                    Edit
                  </Button>
                  <Button
                    size="lg"
                    variant="destructive"
                    data-testid="reject-button"
                    disabled={deciding}
                    onClick={() => openForm("reject")}
                  >
                    <XIcon />
                    Reject
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    size="lg"
                    variant={mode === "reject" ? "destructive" : "default"}
                    data-testid="confirm-button"
                    disabled={deciding || !canConfirm}
                    onClick={confirm}
                  >
                    {mode === "reject" ? <XIcon /> : <CheckIcon />}
                    {field.confirm}
                  </Button>
                  <Button
                    size="lg"
                    variant="ghost"
                    data-testid="cancel-button"
                    disabled={deciding}
                    onClick={() => setMode("buttons")}
                  >
                    Cancel
                  </Button>
                </>
              )}

              {deciding && (
                <span
                  data-testid="approval-status"
                  role="status"
                  className="ml-auto flex items-center gap-2 text-sm text-muted-foreground"
                >
                  <LoaderCircleIcon className="size-4 animate-spin" />
                  {WORKING[status.decision]}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </article>
  )
}

import { HourglassIcon } from "lucide-react"

// Shown in the chat while the front desk checks a booking or an email.
export function FrontDeskWaiting() {
  return (
    <div
      role="status"
      data-testid="waiting-indicator"
      className="flex w-fit max-w-full items-center gap-3 rounded-2xl border border-primary/15 bg-accent px-4 py-3 text-accent-foreground"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-background text-primary">
        <HourglassIcon className="size-4 animate-pulse" />
      </span>
      <div className="flex min-w-0 flex-col gap-0.5">
        <p className="text-sm font-medium">Waiting for the front desk…</p>
        <p className="text-sm text-muted-foreground">
          Your reply will show up here as soon as they have checked.
        </p>
      </div>
    </div>
  )
}

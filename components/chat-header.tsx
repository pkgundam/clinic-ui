import { HeartPulseIcon, LogOutIcon } from "lucide-react"

import { CLINIC_NAME } from "@/lib/config"
import { Button } from "@/components/ui/button"

export function ChatHeader({
  patientName,
  onLogout,
}: {
  patientName: string
  onLogout: () => void
}) {
  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex h-14 w-full max-w-4xl items-center justify-between gap-3 px-4">
        <div className="flex items-center gap-2 font-semibold">
          <span className="flex size-8 items-center justify-center rounded-full bg-accent text-primary">
            <HeartPulseIcon className="size-4" />
          </span>
          {CLINIC_NAME}
        </div>

        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate text-sm text-muted-foreground">
            {patientName}
          </span>
          <Button variant="outline" size="sm" onClick={onLogout}>
            <LogOutIcon />
            Log out
          </Button>
        </div>
      </div>
    </header>
  )
}

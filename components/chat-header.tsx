import { LogOutIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"

export function ChatHeader({
  patientName,
  onLogout,
}: {
  patientName: string
  onLogout: () => void
}) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b px-4">
      {/* Opens and closes the chat list. */}
      <SidebarTrigger />

      <div className="flex min-w-0 items-center gap-2">
        <span className="truncate text-sm text-muted-foreground">
          {patientName}
        </span>
        <Button variant="outline" size="sm" onClick={onLogout}>
          <LogOutIcon />
          Log out
        </Button>
      </div>
    </header>
  )
}

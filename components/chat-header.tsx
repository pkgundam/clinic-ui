import { LogOutIcon } from "lucide-react"

import type { User } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"

export function ChatHeader({
  user,
  onLogout,
}: {
  user: User
  onLogout: () => void
}) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b px-4">
      {/* Opens and closes the chat list. */}
      <SidebarTrigger />

      <div className="flex min-w-0 items-center gap-2">
        <span className="truncate text-sm text-muted-foreground">
          {user.full_name}
        </span>
        {/* The role from login, e.g. "patient" -> "Patient" */}
        <span className="shrink-0 rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground capitalize">
          {user.role}
        </span>
        <Button variant="outline" size="sm" onClick={onLogout}>
          <LogOutIcon />
          Log out
        </Button>
      </div>
    </header>
  )
}

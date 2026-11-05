"use client"

import { HeartPulseIcon, PlusIcon } from "lucide-react"

import type { ChatSummary } from "@/lib/api"
import { CLINIC_NAME } from "@/lib/config"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

// "Nov 5", or "Nov 5, 2025" when it is not this year.
function shortDate(isoDate: string) {
  const date = new Date(isoDate)
  const thisYear = date.getFullYear() === new Date().getFullYear()
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: thisYear ? undefined : "numeric",
  })
}

export function AppSidebar({
  chats,
  activeThreadId,
  disabled,
  onNewChat,
  onOpenChat,
}: {
  chats: ChatSummary[]
  activeThreadId: string | null
  disabled: boolean // true while we wait for a reply
  onNewChat: () => void
  onOpenChat: (threadId: string) => void
}) {
  // On a phone the sidebar is a drawer. Close it once the patient picks something.
  const { setOpenMobile } = useSidebar()

  return (
    <Sidebar variant="inset">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1 font-semibold">
          <span className="flex size-8 items-center justify-center rounded-full bg-sidebar-primary text-sidebar-primary-foreground">
            <HeartPulseIcon className="size-4" />
          </span>
          {CLINIC_NAME}
        </div>

        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              variant="outline"
              disabled={disabled}
              onClick={() => {
                onNewChat()
                setOpenMobile(false)
              }}
            >
              <PlusIcon />
              <span>New chat</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Chats</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu aria-busy={disabled}>
              {chats.map((chat) => (
                <SidebarMenuItem key={chat.thread_id}>
                  <SidebarMenuButton
                    className="h-auto items-start"
                    isActive={chat.thread_id === activeThreadId}
                    disabled={disabled}
                    onClick={() => {
                      onOpenChat(chat.thread_id)
                      setOpenMobile(false)
                    }}
                  >
                    {/* A div (not a span) so the button doesn't cut the text off. */}
                    <div className="flex min-w-0 flex-1 flex-col items-start gap-1 py-1">
                      <span className="text-sm leading-snug break-words">
                        {chat.title || "New chat"}
                      </span>
                      <span className="flex items-center gap-2 text-xs text-muted-foreground">
                        {shortDate(chat.updated_at)}
                        {chat.unfinished && (
                          <span className="rounded-full bg-background px-2 py-0.5 text-[11px] font-medium text-primary">
                            Unfinished
                          </span>
                        )}
                      </span>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}

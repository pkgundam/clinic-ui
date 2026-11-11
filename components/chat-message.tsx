import { ChevronRightIcon, RefreshCwIcon } from "lucide-react"

import type { ToolCall } from "@/lib/api"
import { Markdown } from "@/components/markdown"
import { Tool } from "@/components/tool"
import { Bubble, BubbleContent } from "@/components/ui/bubble"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Message, MessageContent } from "@/components/ui/message"
import { Trace } from "@/components/ui/trace"

export type ChatItem =
  | { id: string; role: "user"; text: string }
  | {
      id: string
      role: "assistant"
      text: string
      toolCalls: ToolCall[]
      intent?: string // old chats don't have these two
      reason?: string
      rejected?: string // the first reply, if it was rewritten
    }

// "clinic_question" -> "Clinic question"
function formatIntent(intent: string) {
  const text = intent.replaceAll("_", " ")
  return text.charAt(0).toUpperCase() + text.slice(1)
}

export function ChatMessage({ item }: { item: ChatItem }) {
  // The patient's message: a blue bubble on the right, like iMessage.
  if (item.role === "user") {
    return (
      <Message align="end">
        <MessageContent>
          <Bubble align="end" className="max-w-[90%] md:max-w-[80%]">
            {/* whitespace-pre-wrap keeps the patient's line breaks */}
            <BubbleContent className="rounded-2xl px-4 whitespace-pre-wrap">
              {item.text}
            </BubbleContent>
          </Bubble>
        </MessageContent>
      </Message>
    )
  }

  // The assistant: tool calls first, then the reply in a gray bubble,
  // then a small note about what the patient asked.
  const note = [item.intent && formatIntent(item.intent), item.reason]
    .filter(Boolean)
    .join(" · ")

  return (
    <Message>
      <MessageContent className="gap-2">
        {item.toolCalls.length > 0 && (
          <Trace>
            {item.toolCalls.map((call, index) => (
              <Tool key={index} call={call} />
            ))}
          </Trace>
        )}
        <Bubble variant="secondary" className="max-w-[90%] md:max-w-[80%]">
          <BubbleContent className="rounded-2xl px-4">
            <Markdown>{item.text}</Markdown>
          </BubbleContent>
        </Bubble>
        {note && <p className="px-2 text-xs text-muted-foreground">{note}</p>}
        {item.rejected && (
          <Collapsible className="px-2 text-xs">
            <CollapsibleTrigger className="group/rewrite flex items-center gap-1 text-muted-foreground hover:text-foreground">
              <RefreshCwIcon className="size-3" />
              Reply was rewritten
              <ChevronRightIcon className="size-3 transition-transform group-data-[panel-open]/rewrite:rotate-90" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <p className="mt-1.5 rounded-lg border border-dashed px-3 py-2 whitespace-pre-wrap text-muted-foreground">
                <span className="font-medium">Original reply: </span>
                {item.rejected}
              </p>
            </CollapsibleContent>
          </Collapsible>
        )}
      </MessageContent>
    </Message>
  )
}

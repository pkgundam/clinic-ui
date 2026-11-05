import type { ToolCall } from "@/lib/api"
import { Markdown } from "@/components/markdown"
import { Tool } from "@/components/tool"
import { Bubble, BubbleContent } from "@/components/ui/bubble"
import { Message, MessageContent } from "@/components/ui/message"
import { Trace } from "@/components/ui/trace"

export type ChatItem =
  | { id: string; role: "user"; text: string }
  | { id: string; role: "assistant"; text: string; toolCalls: ToolCall[] }

export function ChatMessage({ item }: { item: ChatItem }) {
  // The patient's message: a bubble on the right.
  if (item.role === "user") {
    return (
      <Message align="end">
        <MessageContent>
          <Bubble align="end" variant="muted">
            {/* whitespace-pre-wrap keeps the patient's line breaks */}
            <BubbleContent className="whitespace-pre-wrap">
              {item.text}
            </BubbleContent>
          </Bubble>
        </MessageContent>
      </Message>
    )
  }

  // The assistant: tool calls first, then the reply as markdown.
  return (
    <Message>
      <MessageContent className="gap-3">
        {item.toolCalls.length > 0 && (
          <Trace>
            {item.toolCalls.map((call, index) => (
              <Tool key={index} call={call} />
            ))}
          </Trace>
        )}
        <Markdown>{item.text}</Markdown>
      </MessageContent>
    </Message>
  )
}

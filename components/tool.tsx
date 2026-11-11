import { WrenchIcon } from "lucide-react"

import type { ToolCall } from "@/lib/api"
import { CodeBlock, CodeBlockContent } from "@/components/ui/code-block"
import {
  TraceCollapsible,
  TraceCollapsibleContent,
  TraceCollapsibleTrigger,
  TraceIcon,
  TraceLine,
  TraceTitle,
} from "@/components/ui/trace"

// Show text as it is, and everything else (objects, lists) as pretty JSON.
function toText(value: unknown) {
  if (typeof value === "string") return value
  return JSON.stringify(value, null, 2) ?? ""
}

// A failed tool returns { status: "error", message: "..." }.
function hasFailed(result: unknown) {
  return (
    typeof result === "object" &&
    result !== null &&
    "status" in result &&
    result.status === "error"
  )
}

function Section({ title, value }: { title: string; value: unknown }) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs font-medium text-muted-foreground">{title}</p>
      <CodeBlock size="sm">
        <CodeBlockContent wrap className="max-h-64">
          {toText(value)}
        </CodeBlockContent>
      </CodeBlock>
    </div>
  )
}

// One tool call. It is collapsed until you click it.
// Render several of these inside a <Trace>.
export function Tool({ call }: { call: ToolCall }) {
  return (
    <TraceCollapsible>
      <TraceCollapsibleTrigger>
        <TraceLine status={hasFailed(call.result) ? "error" : undefined}>
          <TraceIcon>
            <WrenchIcon />
          </TraceIcon>
          <TraceTitle className="font-mono">{call.name}</TraceTitle>
        </TraceLine>
      </TraceCollapsibleTrigger>
      <TraceCollapsibleContent>
        <div className="flex flex-col gap-3">
          <Section title="Arguments" value={call.args} />
          <Section title="Result" value={call.result} />
        </div>
      </TraceCollapsibleContent>
    </TraceCollapsible>
  )
}

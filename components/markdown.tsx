"use client"

import type { ComponentProps } from "react"
import { Streamdown, type ExtraProps } from "streamdown"

import { useHighlightedCode } from "@/hooks/use-highlighted-code"
import {
  CodeBlock,
  CodeBlockActions,
  CodeBlockContent,
  CodeBlockCopyButton,
  CodeBlockHeader,
  CodeBlockLine,
  CodeBlockTitle,
} from "@/components/ui/code-block"

// Fenced code in a reply (```js ... ```) is shown in a Code Block.
function FencedCode({ code, language }: { code: string; language: string }) {
  const lines = useHighlightedCode(code, language)

  return (
    <CodeBlock>
      <CodeBlockHeader>
        <CodeBlockTitle>{language || "text"}</CodeBlockTitle>
        <CodeBlockActions>
          <CodeBlockCopyButton value={code} />
        </CodeBlockActions>
      </CodeBlockHeader>
      <CodeBlockContent>
        {lines.map((line, index) => (
          <CodeBlockLine key={index}>{line}</CodeBlockLine>
        ))}
      </CodeBlockContent>
    </CodeBlock>
  )
}

function Code({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- keep `node` off the <code> element
  node,
  className,
  children,
  ...props
}: ComponentProps<"code"> & ExtraProps) {
  // Streamdown adds data-block to fenced code only. Everything else is inline.
  if (!("data-block" in props)) {
    return (
      <code
        className="rounded-sm bg-muted px-1 py-0.5 font-mono text-[0.9em]"
        {...props}
      >
        {children}
      </code>
    )
  }

  return (
    <FencedCode
      code={typeof children === "string" ? children : ""}
      language={/language-(\S+)/.exec(className ?? "")?.[1] ?? ""}
    />
  )
}

// Our replies arrive all at once (no streaming), so we use Streamdown's static mode.
export function Markdown({ children }: { children: string }) {
  return (
    <Streamdown mode="static" controls={false} components={{ code: Code }}>
      {children}
    </Streamdown>
  )
}

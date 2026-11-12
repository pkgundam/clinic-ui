"use client"

import { useEffect, useRef, useState } from "react"
import { ArrowUpIcon } from "lucide-react"

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@/components/ui/input-group"

const PLACEHOLDER = "Ask about appointments, doctors or insurance…"

export function ChatInput({
  onSend,
  disabled,
  placeholder = PLACEHOLDER,
}: {
  onSend: (text: string) => void
  disabled: boolean
  placeholder?: string
}) {
  const [text, setText] = useState("")
  const formRef = useRef<HTMLFormElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const canSend = text.trim().length > 0 && !disabled

  // A disabled field loses focus, so put the cursor back when the reply arrives.
  useEffect(() => {
    if (!disabled) textareaRef.current?.focus()
  }, [disabled])

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canSend) return
    onSend(text.trim())
    setText("")
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit}>
      {/* InputGroup fades when ANY child is disabled (like an empty Send button).
          We only want it to fade while the text box itself is disabled. */}
      <InputGroup className="bg-background shadow-sm has-disabled:bg-background has-disabled:opacity-100 has-[textarea:disabled]:opacity-60">
        <InputGroupTextarea
          ref={textareaRef}
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            // Enter sends. Shift+Enter adds a new line.
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault()
              formRef.current?.requestSubmit()
            }
          }}
          disabled={disabled}
          placeholder={placeholder}
          aria-label="Message"
          data-testid="chat-input"
          className="min-h-14 p-3"
        />
        <InputGroupAddon align="block-end">
          <InputGroupButton
            type="submit"
            size="icon-sm"
            variant="default"
            className="ml-auto rounded-full"
            disabled={!canSend}
            aria-label="Send"
            data-testid="send-button"
          >
            <ArrowUpIcon />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </form>
  )
}

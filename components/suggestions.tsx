import { SUGGESTIONS } from "@/lib/config"
import { Button } from "@/components/ui/button"

// A row of one-click prompts. The label is the message that gets sent.
export function Suggestions({
  onPick,
  disabled,
}: {
  onPick: (suggestion: string) => void
  disabled: boolean
}) {
  return (
    <div className="no-scrollbar flex scroll-fade-x gap-2 overflow-x-auto overscroll-x-contain">
      {SUGGESTIONS.map((suggestion) => (
        <Button
          key={suggestion}
          variant="outline"
          size="sm"
          className="shrink-0"
          disabled={disabled}
          onClick={() => onPick(suggestion)}
        >
          {suggestion}
        </Button>
      ))}
    </div>
  )
}

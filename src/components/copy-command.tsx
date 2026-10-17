'use client'

import { useState } from 'react'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group'

/** A shell command in a read-only field, with a button that copies it and says so. Without `prompt`, no `$`: a line of Markdown, say. */
export function CopyCommand({
  command,
  copy = 'Copy',
  copied = 'Copied',
  prompt = '$',
}: {
  command: string
  copy?: string
  copied?: string
  prompt?: string | null
}) {
  const [fait, setFait] = useState(false)
  return (
    <InputGroup className="h-11 bg-card">
      {prompt ? <InputGroupAddon className="font-mono">{prompt}</InputGroupAddon> : null}
      <InputGroupInput
        readOnly
        value={command}
        aria-label={command}
        className="font-mono text-[0.8rem]"
        onFocus={(e) => e.currentTarget.select()}
      />
      <InputGroupAddon align="inline-end">
        <InputGroupButton
          size="sm"
          variant={fait ? 'secondary' : 'ghost'}
          onClick={async () => {
            await navigator.clipboard.writeText(command)
            setFait(true)
            setTimeout(() => setFait(false), 2000)
          }}
        >
          {fait ? copied : copy}
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  )
}

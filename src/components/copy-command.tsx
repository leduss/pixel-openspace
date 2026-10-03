'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

/** A shell command with a button that copies it, and says so. */
export function CopyCommand({ command }: { command: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="flex w-full max-w-full items-stretch overflow-hidden rounded-lg border bg-card">
      <pre className="min-w-0 flex-1 overflow-x-auto px-4 py-3 font-mono text-[0.8rem] leading-relaxed text-foreground">
        <span className="text-muted-foreground select-none">$ </span>
        {command}
      </pre>
      <Button
        variant="ghost"
        className="h-auto shrink-0 rounded-none border-l px-4"
        onClick={async () => {
          await navigator.clipboard.writeText(command)
          setCopied(true)
          setTimeout(() => setCopied(false), 2000)
        }}
      >
        {copied ? 'Copied' : 'Copy'}
      </Button>
    </div>
  )
}

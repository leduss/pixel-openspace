import { Demo } from '@/components/demo'

const INSTALL = 'npx shadcn@latest add https://raw.githubusercontent.com/leduss/pixel-openspace/main/public/r/pixel-openspace.json'

export default function Page() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10">
      <header className="flex flex-col gap-3">
        <h1 className="font-[family-name:var(--font-pixel)] text-4xl tracking-tight">pixel-openspace</h1>
        <p className="max-w-2xl text-muted-foreground">
          A pixel-art open space where your scheduled jobs and AI agents come to work. Whoever is running sits and types, idle ones wander
          to the coffee machine, and a failed job’s PC starts smoking while the lead comes over.
        </p>
        <pre className="w-fit max-w-full overflow-x-auto rounded-lg border bg-muted px-3 py-2 text-xs">
          <code>{INSTALL}</code>
        </pre>
      </header>
      <Demo />
      <footer className="text-sm text-muted-foreground">
        MIT ·{' '}
        <a className="underline underline-offset-4" href="https://github.com/leduss/pixel-openspace">
          GitHub
        </a>
      </footer>
    </main>
  )
}

import { Button } from '@/components/ui/button'
import { CopyCommand } from '@/components/copy-command'
import { Demo } from '@/components/demo'

const DEPOT = 'https://github.com/leduss/pixel-openspace'
const INSTALL = 'npx shadcn@latest add https://raw.githubusercontent.com/leduss/pixel-openspace/main/public/r/pixel-openspace.json'

/* Le tableau d'affichage du hall : ce que chaque état fait voir dans la salle. */
const ETATS: Array<{ status: string; lampe: string; voit: string }> = [
  { status: 'working', lampe: '#e8b923', voit: 'Sits at its desk and types. Code scrolls on its screen, its keyboard and fans light up.' },
  { status: 'ok', lampe: '#4ade80', voit: 'Up to date. Gets up now and then for a coffee, a round of arcade or a chat with a colleague.' },
  { status: 'late', lampe: '#fb923c', voit: 'Missed its run. Dozes at its desk until it catches up.' },
  { status: 'failed', lampe: '#ef4444', voit: 'Red screen, smoking PC. The lead walks over and stays until it recovers.' },
  { status: 'off', lampe: '#71717a', voit: 'Not loaded. An empty chair and a post-it on a dark screen.' },
  { status: 'never', lampe: '#a1a1aa', voit: 'Hired, but has not run yet.' },
  { status: 'on-demand', lampe: '#38bdf8', voit: 'Only works when asked. Lives its life in between.' },
]

const ROUTE = `// app/api/jobs/route.ts
export async function GET() {
  const jobs = await db.job.findMany()
  return Response.json(
    jobs.map((job) => ({
      id: job.id,
      name: job.name,
      emoji: job.emoji,
      status: job.running ? 'working' : job.lastExitCode ? 'failed' : 'ok',
      lastRun: job.lastRunAt,
      nextRun: job.nextRunAt,
      lastMessage: job.lastLogLine,
    })),
  )
}`

const PAGE = `// app/office/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { PixelOpenspace } from '@/components/pixel-openspace/pixel-openspace'
import type { Agent } from '@/components/pixel-openspace/types'

export default function Office() {
  const [agents, setAgents] = useState<Agent[]>([])

  useEffect(() => {
    const load = () => fetch('/api/jobs').then((r) => r.json()).then(setAgents)
    load()
    const timer = setInterval(load, 5000)
    return () => clearInterval(timer)
  }, [])

  return (
    <PixelOpenspace
      agents={agents}
      onRun={(agent) => fetch(\`/api/jobs/\${agent.id}/run\`, { method: 'POST' })}
    />
  )
}`

/* Les petites choses de la salle, pour qui veut savoir ce qu'il installe. */
const DETAILS: Array<{ quoi: string; detail: string }> = [
  { quoi: 'Two arcade cabinets', detail: 'Component Snake and Chip Breaker, both playable. High scores hang on the wall.' },
  { quoi: 'A wall screen', detail: 'Up to four numbers of your own: jobs today, errors, queue size, budget.' },
  { quoi: 'The lead', detail: 'Does its rounds while it runs, then reports in front of the wall screen and reads your announcements.' },
  { quoi: 'A window on the weather', detail: 'Sun, rain, snow or storm, day or night, with the temperature you pass it.' },
  { quoi: 'Visitors and couriers', detail: 'Bump a counter and someone walks in: a visitor greets the lead, a courier drops a parcel.' },
  { quoi: 'Seasons', detail: 'Pumpkins and a ghost all October, a Christmas tree and garlands all December.' },
  { quoi: 'The office cat', detail: 'Naps on whichever desk was left empty.' },
  {
    quoi: 'Alerts and sound',
    detail: 'Browser notifications when a job fails, 8-bit beeps for starts and failures. Both off until you turn them on.',
  },
]

function Code({ titre, code }: { titre: string; code: string }) {
  return (
    <figure className="flex min-w-0 flex-col overflow-hidden rounded-lg border bg-card">
      <figcaption className="border-b px-4 py-2 text-sm text-muted-foreground">{titre}</figcaption>
      <pre className="overflow-x-auto p-4 font-mono text-[0.78rem] leading-relaxed">
        <code>{code}</code>
      </pre>
    </figure>
  )
}

export default function Page() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col px-4 sm:px-6">
      <header className="flex items-center justify-between py-6">
        <span className="font-heading text-lg">pixel-openspace</span>
        <nav className="flex items-center gap-1 text-sm">
          <a className="rounded-md px-3 py-1.5 text-muted-foreground hover:text-foreground" href="#setup">
            Set it up
          </a>
          <a className="rounded-md px-3 py-1.5 text-muted-foreground hover:text-foreground" href={DEPOT}>
            GitHub
          </a>
        </nav>
      </header>

      {/* Le haut de page : le titre, la commande, puis la salle elle-même. */}
      <section className="flex flex-col gap-8 pt-10 pb-20 sm:pt-16">
        <div className="flex flex-col gap-6">
          <h1 className="max-w-3xl font-heading text-5xl leading-[0.95] tracking-tight text-balance sm:text-7xl">
            Your cron jobs, at their desks.
          </h1>
          <p className="max-w-[60ch] text-lg leading-relaxed text-muted-foreground">
            pixel-openspace shows your scheduled jobs and AI agents as a pixel-art office. Running jobs sit down and type, idle ones go get
            coffee, and when one fails its PC starts to smoke and the lead walks over.
          </p>
          <div className="flex flex-col gap-3">
            <CopyCommand command={INSTALL} />
            <div className="flex flex-wrap items-center gap-3">
              <Button size="lg" nativeButton={false} render={<a href={DEPOT} />}>
                Star it on GitHub
              </Button>
              <p className="text-sm text-muted-foreground">
                A shadcn/ui component for Next.js and React. Free and open source under the MIT license.
              </p>
            </div>
          </div>
        </div>
        <Demo />
      </section>

      {/* Le tableau d'affichage du hall. */}
      <section className="grid gap-10 border-t py-20 lg:grid-cols-[1fr_1.6fr]">
        <div className="flex max-w-[45ch] flex-col gap-4">
          <h2 className="font-heading text-3xl sm:text-4xl">Read the room</h2>
          <p className="leading-relaxed text-muted-foreground">
            Each job gets a desk and a status. You set the status from whatever you already track: an exit code, a queue, a last run date.
            The room does the rest, so one glance tells you what is running, what is stuck and what broke.
          </p>
        </div>
        <dl
          className="flex flex-col rounded-xl border-4 p-2"
          style={{
            borderColor: '#5c4a2a',
            background: 'repeating-linear-gradient(0deg, #15171b 0 13px, #1a1c21 13px 14px)',
          }}
        >
          {ETATS.map((e) => (
            <div key={e.status} className="grid grid-cols-[1rem_7rem_1fr] items-baseline gap-x-3 px-4 py-3">
              <span className="size-2.5 rounded-full" style={{ background: e.lampe, boxShadow: `0 0 8px ${e.lampe}` }} />
              <dt className="font-heading text-base text-[#ece6d6]">{e.status}</dt>
              <dd className="text-sm leading-relaxed text-[#bdb6a4]">{e.voit}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Les trois étapes : c'est une vraie suite, d'où les numéros. */}
      <section id="setup" className="flex scroll-mt-6 flex-col gap-12 border-t py-20">
        <h2 className="font-heading text-3xl sm:text-4xl">Set it up in three steps</h2>
        <ol className="flex flex-col gap-14">
          <li className="grid gap-4 lg:grid-cols-[3rem_1fr] lg:gap-6">
            <span className="font-heading text-3xl text-primary">1</span>
            <div className="flex min-w-0 flex-col gap-4">
              <h3 className="text-xl font-bold">Add the component</h3>
              <p className="max-w-[65ch] leading-relaxed text-muted-foreground">
                The shadcn CLI copies five files into your <code className="font-mono text-sm text-foreground">components</code> folder,
                yours to read and change. The labels in the room use Pixelify Sans: load it with{' '}
                <code className="font-mono text-sm text-foreground">next/font</code> into a{' '}
                <code className="font-mono text-sm text-foreground">--font-pixel</code> variable.
              </p>
              <CopyCommand command={INSTALL} />
            </div>
          </li>
          <li className="grid gap-4 lg:grid-cols-[3rem_1fr] lg:gap-6">
            <span className="font-heading text-3xl text-primary">2</span>
            <div className="flex min-w-0 flex-col gap-4">
              <h3 className="text-xl font-bold">Feed it your jobs</h3>
              <p className="max-w-[65ch] leading-relaxed text-muted-foreground">
                Expose your jobs’ state, poll it every few seconds and pass it down. When a status changes, the room reacts: the job sits
                down to work, or stands up, stretches and says its last log line in a speech bubble.
              </p>
              <div className="grid max-w-3xl gap-4">
                <Code titre="Your API route" code={ROUTE} />
                <Code titre="Your page" code={PAGE} />
              </div>
            </div>
          </li>
          <li className="grid gap-4 lg:grid-cols-[3rem_1fr] lg:gap-6">
            <span className="font-heading text-3xl text-primary">3</span>
            <div className="flex min-w-0 flex-col gap-4">
              <h3 className="text-xl font-bold">Leave it on a screen</h3>
              <p className="max-w-[65ch] leading-relaxed text-muted-foreground">
                It is made to stay open all day on a side screen, in fullscreen. The room runs at 30 frames per second and only redraws what
                moved. After twenty quiet seconds everything freezes until someone gets up, and at night everybody stays at their desk.
              </p>
            </div>
          </li>
        </ol>
      </section>

      {/* Les petites choses de la salle. */}
      <section className="grid gap-10 border-t py-20 lg:grid-cols-[1fr_1.6fr]">
        <div className="flex max-w-[45ch] flex-col gap-4">
          <h2 className="font-heading text-3xl sm:text-4xl">Also in the room</h2>
          <p className="leading-relaxed text-muted-foreground">
            None of this is needed to watch your jobs. It is there because an office you look at every day should be a nice place.
          </p>
        </div>
        <dl className="grid gap-x-10 gap-y-6 sm:grid-cols-2">
          {DETAILS.map((d) => (
            <div key={d.quoi} className="flex flex-col gap-1">
              <dt className="font-bold">{d.quoi}</dt>
              <dd className="text-sm leading-relaxed text-muted-foreground">{d.detail}</dd>
            </div>
          ))}
        </dl>
      </section>

      <footer className="flex flex-col gap-2 border-t py-10 text-sm text-muted-foreground sm:flex-row sm:justify-between">
        <p>
          Made at{' '}
          <a className="underline underline-offset-4 hover:text-foreground" href="https://montematour.fr">
            Monte Ma Tour
          </a>
          , a custom PC workshop on the Bassin d’Arcachon.
        </p>
        <p>
          MIT license.{' '}
          <a className="underline underline-offset-4 hover:text-foreground" href={DEPOT}>
            Source on GitHub
          </a>
        </p>
      </footer>
    </main>
  )
}

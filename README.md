# pixel-openspace

**A pixel-art open space where your scheduled jobs and AI agents come to work.**

Every agent gets a desk. Whoever is running sits down and types, screen lit up. Idle ones wander off to the coffee machine, the arcade cabinets or a colleague’s desk. A failed job’s PC starts smoking and the lead walks over and stays until it recovers. Late ones doze, forgotten ones see their plant wilt and dust settle on their screen.

**[Try the live demo](https://pixel-openspace.vercel.app)** · [🇫🇷 Lire en français](./README.fr.md)

![The pixel-openspace demo: jobs start, fail and recover across the five themes](./public/docs/demo.gif)

There are two ways to use it:

- **In your app**: a [shadcn/ui](https://ui.shadcn.com) component for Next.js and React. The code is copied into your project, styled by your own `Button` and `Card`, and you feed it your jobs: cron jobs, queues, AI agents, CI pipelines.
- **Without writing code**: a small local server that reads the jobs already scheduled on your machine (launchd, cron, systemd timers) and opens their open space in your browser.

## In your app

### Install

In a project with shadcn/ui set up:

```bash
npx shadcn@latest add leduss/pixel-openspace/pixel-openspace
```

The files land in `components/pixel-openspace/`. The labels in the room use [Pixelify Sans](https://fonts.google.com/specimen/Pixelify+Sans) through a `--font-pixel` CSS variable; with Next.js:

```tsx
// app/layout.tsx
import { Pixelify_Sans } from 'next/font/google'
const pixel = Pixelify_Sans({ variable: '--font-pixel', subsets: ['latin'] })
// …and add pixel.variable to <html className>
```

### Update

The code lives in your project, so updating means running the same command again with `--overwrite`. Your own edits in `components/pixel-openspace/` are replaced. What changed is in the [changelog](./CHANGELOG.md).

```bash
npx shadcn@latest add leduss/pixel-openspace/pixel-openspace --overwrite
```

### Use

```tsx
'use client'

import { PixelOpenspace } from '@/components/pixel-openspace/pixel-openspace'

export function Office() {
  return (
    <PixelOpenspace
      language="en"
      agents={[
        { id: 'backup', name: 'Backup', emoji: '💾', status: 'ok', schedule: 'daily at 2:30', nextRun: '2026-10-04T02:30:00Z' },
        { id: 'deploy', name: 'Deploy', emoji: '🚀', status: 'failed', lastMessage: 'build failed: type error' },
        { id: 'inbox', name: 'Inbox', emoji: '📨', status: 'working', role: 'Triages the support inbox with an LLM' },
      ]}
      wall={[{ label: 'Jobs today', value: 128, tone: 'info' }]}
      weather={{ temperature: 19, sky: 'clouds', day: true, place: 'Lanton' }}
      onRun={(agent) => fetch(`/api/jobs/${agent.id}/run`, { method: 'POST' })}
    />
  )
}
```

The component is driven by its props: the room redraws itself from whatever you pass it.

### Feed it your jobs

Expose your jobs’ state, poll it every few seconds and pass it down. When a status changes, the room reacts: the job sits down to work, or stands up, stretches and says its last log line in a speech bubble. The two files below are a starting point: an API route that reads your jobs, and a page that polls it.

```ts
// app/api/jobs/route.ts
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
}
```

```tsx
// app/office/page.tsx
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
      onRun={(agent) => fetch(`/api/jobs/${agent.id}/run`, { method: 'POST' })}
    />
  )
}
```

### CI pipelines too

Anything that runs, passes or fails can have a desk: a GitHub Actions workflow, a GitLab pipeline, a deploy. While it runs, its agent types; when the build breaks, its PC smokes and the lead walks over; every run of the day is a dot on the timeline. Here, the last runs of a GitHub workflow become one more agent to add to the others. GitHub allows 60 calls an hour without a token: keep the answer a minute or two before asking again.

```ts
// app/api/ci/route.ts
export async function GET() {
  const res = await fetch('https://api.github.com/repos/OWNER/REPO/actions/workflows/ci.yml/runs?per_page=30', {
    headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` },
  })
  const { workflow_runs: runs } = await res.json()
  const running = runs.find((run) => run.status !== 'completed')
  const done = runs.filter((run) => run.status === 'completed' && run.conclusion !== 'cancelled')
  const last = done[0]
  return Response.json({
    id: 'ci',
    name: 'CI',
    emoji: '🧪',
    schedule: 'on every push',
    status: running ? 'working' : !last ? 'never' : last.conclusion === 'success' ? 'ok' : 'failed',
    lastMessage: (running ?? last)?.display_title,
    lastRun: last?.updated_at,
    runs: done.reverse().map((run) => ({ at: run.run_started_at, ok: run.conclusion === 'success', message: run.display_title })),
  })
}
```

### Agent statuses

| `status` | In the room |
| --- | --- |
| `working` | At its desk, typing, code scrolling on its screen |
| `ok` | Up to date: wanders to the coffee machine, the arcade, the sofa… |
| `late` | Dozes at its desk |
| `failed` | Red screen, smoking PC; the lead comes and stays by its side |
| `off` | Empty chair, a post-it on a dark screen |
| `never` | Never ran yet |
| `on-demand` | Only runs when asked |

### Props

| Prop | Type | |
| --- | --- | --- |
| `agents` | `Agent[]` | Five desks per row, rows added as needed |
| `lead` | `Agent` | The lead in the glass office; a decorative one sits there if none is given |
| `title` | `string` | The sign on the main room wall |
| `wall` | `WallTile[]` | Up to four tiles on the big wall screen (`label`, `value`, `tone`, `progress`). Without it, the screen counts your agents; `[]` leaves it dark |
| `announcements` | `string[]` | What the lead announces in front of the wall screen after its rounds |
| `weather` | `Weather \| null` | The sky behind the lead’s window: `clear`, `clouds`, `fog`, `rain`, `snow`, `storm` |
| `visitors` | `number` | A counter: each time it goes up, a visitor walks in to greet the lead |
| `deliveries` | `number` | A counter: each time it goes up, a courier drops a parcel by the boxes |
| `celebrate` | `boolean` | Confetti over the whole room |
| `timeline` | `boolean` | The day timeline under the room, one dot per run, when agents have `runs` (default `true`) |
| `language` | `'en' \| 'fr'` | Everything written and said in the room |
| `theme` | `'geek' \| 'eighties' \| 'gym' \| 'modern' \| 'kitchen'` | The look of the room (default `'geek'`, see below) |
| `columns` | `4 \| 5 \| 6` | How many desks per row (default `5`). Also in the settings |
| `seasonal` | `boolean` | Halloween all October, Christmas all December, Easter for the two weeks before Easter Monday (default `true`) |
| `nightHours` | `[number, number]` | When everybody stays at their desk (default `[22, 6]`) |
| `toolbar` | `boolean` | The fullscreen button and the settings gear (default `true`) |
| `objectLinks` | `Partial<Record<SceneObject, string>>` | Make the workbench, TV, server rack, vending machine, fridge or parts boxes clickable |
| `onObjectClick` | `(object, href) => void` | Called instead of following the link, for client-side routers |
| `onRun` | `(agent) => void \| Promise<void>` | Shows a “Run now” button on each agent’s card |
| `now` | `number` | The current time, to render on the server; without it the scene draws once in the browser |

Each `Agent` has an `id`, a `name`, a `status`, and optionally an `emoji`, a `role`, a `schedule`, `lastMessage`, `lastRun`, `nextRun` (its screen counts down the last ten minutes), `staleAfterHours` (72 by default: after that without a run, its plant wilts) and `runs`, today’s runs as `{ at, ok, message }` for the timeline.

## Without writing code

The `cli/` folder holds a small server that finds the jobs scheduled on your machine and shows them in the open space:

- **launchd** (macOS): your agents in `~/Library/LaunchAgents` that run on a schedule. Running or not, last exit code, last line of their log.
- **cron**: your crontab. cron keeps no history, so each run is assumed to have happened on time.
- **systemd** (Linux): your user timers, with the result of their last run and their last journal line.

One command, with Node.js 18.3 or later:

```bash
npx pixel-openspace --match backup --theme modern
```

The server listens on `127.0.0.1:4747` only and opens your browser. The useful options:

| Option | |
| --- | --- |
| `-m, --match <text>` | Only show jobs whose name contains this text (repeatable). Also brings in services that have no schedule |
| `-x, --exclude <text>` | Hide jobs whose name contains this text (repeatable) |
| `-t, --theme <name>` | `geek`, `eighties`, `gym`, `modern` or `kitchen`; `?theme=gym` in the address works too |
| `-l, --lang <en\|fr>` | Language of the room (default: your system’s) |
| `-w, --weather <place>` | Real weather behind the lead’s window, from [Open-Meteo](https://open-meteo.com): a city or `latitude,longitude` |
| `--allow-run` | Let the “Run now” button start a job (`launchctl kickstart`, `systemctl start`); off by default |
| `--json` | Print the jobs it found and exit |

Every option can also live in a `pixel-openspace.json` file, in the current folder or in `~/.config/pixel-openspace/config.json`, along with a nicer name, emoji or description per job:

```json
{
  "title": "ACME OPS",
  "theme": "eighties",
  "language": "en",
  "weather": "Lanton",
  "match": ["acme"],
  "agents": {
    "com.acme.backup": { "name": "Backup", "emoji": "💾", "role": "Dumps the database to S3" },
    "com.acme.old-sync": { "hidden": true }
  }
}
```

## What else is in the room

- Five themes: a geek open space with RGB towers (`geek`), a 1986 corporate office with wood panelling and green-phosphor CRTs (`eighties`), a gym where every job rides an exercise bike (`gym`), and a bright modern office in light oak with laptops, standing desks and a ping-pong table (`modern`), and a restaurant kitchen where every job cooks at its range and a failed one burns its pan (`kitchen`).
- Two playable arcade cabinets, **Component Snake** and **Chip Breaker**, with their high scores on the wall.
- A whiteboard with the next five runs, a real-time clock, the office cat napping on empty desks.
- The seasons: Halloween all October, Christmas all December, and Easter for the two weeks before Easter Monday, with hidden eggs and a bunny.
- Day and night: the room darkens in the evening, and the RGB towers, neon signs, lamps and screens glow.
- A settings gear: whoever watches the room renames the sign on the wall, picks the city whose real weather shows at the window (from [Open-Meteo](https://open-meteo.com), no key needed), the theme, the number of desks per row and the language, turns on the 8-bit sound and browser alerts, and turns off the seasons, the night, the walking around or the day timeline. Their choices stay in their browser and win over the props.
- Browser notifications when an agent fails, and an 8-bit sound for starts, failures and visitors (both opt-in).
- `prefers-reduced-motion` is respected: everybody stays put.

## Light on the CPU

The page is meant to stay open all day on a side screen. The loop runs at 30 fps and only redraws what changed. The decorative animations are driven by that loop, not by the browser’s SVG animations. After 20 calm seconds the scene freezes, and at night everybody stays at their desk.

## Develop

```bash
bun install
bun dev                  # the demo, on http://localhost:3000
bun run test             # the movement engine, the seasons, the schedules
bun run registry:build   # rebuilds public/r/pixel-openspace.json
bun run cli:build        # builds the local server into cli/dist
```

The component lives in `registry/pixel-openspace/`, the local server in `cli/`, the landing page in `src/`.

## Credits

Born in the workshop of [Monte Ma Tour](https://montematour.fr), a custom PC builder on the Bassin d’Arcachon, to keep an eye on the jobs running the business. The code speaks French inside: that is where it grew up.

## Support

If pixel-openspace brightens your screen, you can [buy me a coffee](https://buymeacoffee.com/leduss) ☕. It pays for the hours spent drawing new themes.

<a href="https://buymeacoffee.com/leduss"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy me a coffee" height="48"></a>

## License

[MIT](./LICENSE)

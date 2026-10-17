'use client'

/*
 * La journée en frise, sous la salle : une ligne par agent, de minuit à
 * minuit, un point par passage (vert s'il s'est bien passé, rouge sinon), et
 * le trait de l'heure qu'il est. De quoi voir d'un coup d'œil qui a sauté un
 * passage cette nuit. Un clic sur un nom déplie ses passages du jour, du plus
 * récent au plus ancien, et depuis quand il échoue.
 */

import { Fragment, useState } from 'react'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useTextes } from './primitives'
import type { Agent, AgentRun } from './types'

const JOUR_MS = 86_400_000
const HEURES = [0, 3, 6, 9, 12, 15, 18, 21, 24]

/** Le premier raté de la série en cours, quand le dernier passage a raté : depuis quand ça ne marche plus. */
export function enEchecDepuis(passages: Array<AgentRun>): string | null {
  let depuis: string | null = null
  for (let i = passages.length - 1; i >= 0 && passages[i].ok === false; i--) depuis = passages[i].at
  return depuis
}

export function Frise({ agents, maintenant, choisir }: { agents: Array<Agent>; maintenant: number; choisir: (id: string) => void }) {
  const t = useTextes()
  const [deplie, setDeplie] = useState<string | null>(null)
  const minuit = new Date(maintenant)
  minuit.setHours(0, 0, 0, 0)
  const debut = minuit.getTime()
  const position = (ms: number) => `${Math.min(100, Math.max(0, ((ms - debut) / JOUR_MS) * 100))}%`
  // Seuls les passages d'aujourd'hui entrent dans la frise.
  const lignes = agents.map((a) => ({ agent: a, passages: (a.runs ?? []).filter((r) => Date.parse(r.at) >= debut) }))
  const total = lignes.reduce((n, l) => n + l.passages.length, 0)
  const rates = lignes.reduce((n, l) => n + l.passages.filter((r) => r.ok === false).length, 0)
  const heure = (iso: string) => new Date(iso).toLocaleTimeString(t.locale, { hour: '2-digit', minute: '2-digit' })

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.timeline.title}</CardTitle>
        <CardAction className="text-xs text-muted-foreground">
          {t.timeline.runs(total)}
          {rates ? <span className="text-destructive"> · {t.timeline.failed(rates)}</span> : null}
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-[minmax(6rem,9rem)_1fr] gap-x-3 gap-y-1.5 text-xs">
          {/* Les heures. */}
          <span />
          <div className="relative h-4 text-[0.65rem] text-muted-foreground">
            {HEURES.map((h) => (
              <span
                key={h}
                className={`absolute whitespace-nowrap ${h === 0 ? '' : h === 24 ? '-translate-x-full' : '-translate-x-1/2'}`}
                style={{ left: `${(h / 24) * 100}%` }}
              >
                {t.timeline.hour(h)}
              </span>
            ))}
          </div>

          {lignes.map(({ agent, passages }) => (
            <Fragment key={agent.id}>
              <button
                type="button"
                aria-expanded={deplie === agent.id}
                aria-controls={`passages-${agent.id}`}
                onClick={() => {
                  setDeplie((d) => (d === agent.id ? null : agent.id))
                  choisir(agent.id)
                }}
                className={`truncate text-left hover:text-primary ${deplie === agent.id ? 'text-primary' : ''}`}
              >
                {agent.emoji ? <span aria-hidden>{agent.emoji} </span> : null}
                {agent.name}
              </button>
              <div className="relative h-5 rounded bg-muted/50">
                {[6, 12, 18].map((h) => (
                  <span key={h} className="absolute inset-y-0 w-px bg-border" style={{ left: `${(h / 24) * 100}%` }} />
                ))}
                {passages.map((r, i) => (
                  <span
                    key={`${r.at}-${i}`}
                    title={`${heure(r.at)} · ${r.message || t.timeline.run}`}
                    className={`absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-background ${
                      r.ok === false ? 'bg-red-500' : 'bg-emerald-500'
                    }`}
                    style={{ left: position(Date.parse(r.at)) }}
                  />
                ))}
                <span className="absolute inset-y-[-2px] w-0.5 bg-primary" style={{ left: position(maintenant) }} />
              </div>
              {deplie === agent.id ? <Passages id={`passages-${agent.id}`} passages={passages} heure={heure} /> : null}
            </Fragment>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

/** Les passages du jour d'un agent, du plus récent au plus ancien, sur toute la largeur de la frise. */
function Passages({ id, passages, heure }: { id: string; passages: Array<AgentRun>; heure: (iso: string) => string }) {
  const t = useTextes()
  const depuis = enEchecDepuis(passages)
  return (
    <div id={id} className="col-span-2 mb-1.5 rounded-md border bg-muted/30 p-2">
      {depuis ? <p className="mb-1.5 font-medium text-destructive">{t.timeline.failingSince(heure(depuis))}</p> : null}
      {passages.length ? (
        <ol className="flex max-h-48 flex-col gap-1 overflow-y-auto">
          {[...passages].reverse().map((r, i) => (
            <li key={`${r.at}-${i}`} className="grid grid-cols-[3rem_4.5rem_1fr] items-baseline gap-2">
              <span className="font-mono text-muted-foreground tabular-nums">{heure(r.at)}</span>
              <span className={`flex items-center gap-1.5 ${r.ok === false ? 'text-destructive' : ''}`}>
                <span className={`size-2 shrink-0 rounded-full ${r.ok === false ? 'bg-red-500' : 'bg-emerald-500'}`} />
                {r.ok === false ? t.timeline.failedRun : t.timeline.ok}
              </span>
              <span className="truncate font-mono text-[0.65rem] text-muted-foreground" title={r.message}>
                {r.message}
              </span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-muted-foreground">{t.timeline.noRuns}</p>
      )}
    </div>
  )
}

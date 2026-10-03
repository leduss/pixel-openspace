'use client'

/*
 * La journée en frise, sous la salle : une ligne par agent, de minuit à
 * minuit, un point par passage (vert s'il s'est bien passé, rouge sinon), et
 * le trait de l'heure qu'il est. De quoi voir d'un coup d'œil qui a sauté un
 * passage cette nuit.
 */

import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useTextes } from './primitives'
import type { Agent } from './types'

const JOUR_MS = 86_400_000
const HEURES = [0, 3, 6, 9, 12, 15, 18, 21, 24]

export function Frise({ agents, maintenant, choisir }: { agents: Array<Agent>; maintenant: number; choisir: (id: string) => void }) {
  const t = useTextes()
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
            <div key={agent.id} className="contents">
              <button type="button" onClick={() => choisir(agent.id)} className="truncate text-left hover:text-primary">
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
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

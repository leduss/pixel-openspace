'use client'

/*
 * La fiche d'un agent, accrochée au-dessus de son bureau quand on clique dessus.
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { LARGEUR } from './engine'
import { LAMPE_PLAN, useTextes } from './primitives'
import type { Agent } from './types'
import { type Vue, depuis, heureCourte } from './vue'

/** La carte d'un agent, posée sur la scène au-dessus de lui (ou en dessous, près du haut). */
export function Carte({
  agent,
  ancre,
  hauteur,
  maintenant,
  lancer,
  fermer,
}: {
  agent: Vue
  ancre: { x: number; haut: number; bas: number }
  hauteur: number
  maintenant: number
  lancer?: (agent: Agent) => void | Promise<void>
  fermer: () => void
}) {
  const t = useTextes()
  const { fiche, statut, brut, prochain } = agent
  const [enCours, setEnCours] = useState(false)
  const dessous = ancre.haut < 240
  const horizontal = ancre.x < 160 ? '0%' : ancre.x > LARGEUR - 160 ? '-100%' : '-50%'
  const travaille = statut === 'au-travail'
  return (
    <Card
      // L'attribut plutôt que la prop : la carte compacte du style Base UI, sans gêner le style Radix qui ne la connaît pas.
      data-size="sm"
      className="absolute z-10 w-72 shadow-xl"
      style={{
        left: `${(ancre.x / LARGEUR) * 100}%`,
        top: `${((dessous ? ancre.bas : ancre.haut) / hauteur) * 100}%`,
        transform: dessous ? `translate(${horizontal}, 10px)` : `translate(${horizontal}, calc(-100% - 10px))`,
      }}
    >
      <CardHeader>
        <CardTitle>
          <span aria-hidden>{fiche.emoji}</span> {fiche.nom}
        </CardTitle>
        {fiche.role ? <CardDescription>{fiche.role}</CardDescription> : null}
        <CardAction>
          <Button variant="ghost" size="icon-xs" onClick={fermer} aria-label={t.close}>
            ✕
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant={statut === 'en-echec' ? 'destructive' : 'secondary'}>
            <span className="size-1.5 rounded-full" style={{ background: LAMPE_PLAN[statut] }} />
            {t.statuses[statut]}
          </Badge>
          {fiche.rythme ? <Badge variant="outline">{fiche.rythme}</Badge> : null}
        </div>
        <p className="text-muted-foreground">
          {t.lastRun} {depuis(brut.dernierPassage, maintenant, t)}
          {prochain ? ` · ${t.nextRun} ${heureCourte(prochain, maintenant, t.locale)}` : ''}
        </p>
        {brut.dernierMessage && statut !== 'absent' ? (
          <p className="line-clamp-2 rounded-md bg-muted px-2 py-1 font-mono text-[0.65rem]">{brut.dernierMessage}</p>
        ) : null}
      </CardContent>
      {lancer ? (
        <CardFooter>
          <Button
            size="sm"
            disabled={enCours || travaille}
            onClick={async () => {
              setEnCours(true)
              try {
                await lancer(agent.source)
              } finally {
                setEnCours(false)
              }
            }}
          >
            {enCours ? t.launching : travaille ? t.running : t.runNow}
          </Button>
        </CardFooter>
      ) : null}
    </Card>
  )
}

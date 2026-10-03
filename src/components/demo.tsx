'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { PixelOpenspace } from '@/registry/pixel-openspace/pixel-openspace'
import { MOTS, equipe } from '@/data/demo'
import type { AgentStatus, Language } from '@/registry/pixel-openspace/types'

export function Demo({ langue }: { langue: Language }) {
  const m = MOTS[langue]
  const [agents, setAgents] = useState(() => equipe(langue))
  const [visiteurs, setVisiteurs] = useState(0)
  const [livraisons, setLivraisons] = useState(0)
  const [fete, setFete] = useState(false)

  const changer = (id: string, status: AgentStatus, lastMessage?: string) =>
    setAgents((liste) =>
      liste.map((a) => (a.id === id ? { ...a, status, ...(lastMessage ? { lastMessage, lastRun: new Date().toISOString() } : {}) } : a)),
    )

  /* La démo vit toute seule : toutes les 12 secondes, un agent se met au travail, puis finit. */
  useEffect(() => {
    const libres = equipe(langue).filter((a) => a.status === 'ok')
    const messages = MOTS[langue].messages
    const t = setInterval(() => {
      const a = libres[Math.floor(Math.random() * libres.length)]
      changer(a.id, 'working')
      setTimeout(() => changer(a.id, 'ok', messages[Math.floor(Math.random() * messages.length)]), 6_000)
    }, 12_000)
    return () => clearInterval(t)
  }, [langue])

  const essais: Array<{ label: string; faire: () => void; variant?: 'default' | 'secondary' | 'outline' | 'destructive' }> = [
    { label: m.lancer, faire: () => changer('invoices', 'working') },
    { label: m.finir, faire: () => changer('invoices', 'ok', m.finiMessage), variant: 'secondary' },
    { label: m.casser, faire: () => changer('emails', 'failed', m.casseMessage), variant: 'destructive' },
    { label: m.reparer, faire: () => changer('emails', 'ok', m.repareMessage), variant: 'secondary' },
    { label: m.visiteur, faire: () => setVisiteurs((n) => n + 1), variant: 'outline' },
    { label: m.colis, faire: () => setLivraisons((n) => n + 1), variant: 'outline' },
    { label: fete ? m.stopConfettis : m.confettis, faire: () => setFete((f) => !f), variant: 'outline' },
  ]

  return (
    <div className="flex flex-col gap-4">
      <PixelOpenspace
        agents={agents}
        language={langue}
        title="ACME OPS"
        toolbar={false}
        visitors={visiteurs}
        deliveries={livraisons}
        celebrate={fete}
        wall={[
          { label: m.mur[0], value: 128, tone: 'info' },
          { label: m.mur[1], value: agents.filter((a) => a.status === 'failed').length, tone: 'alert' },
          { label: m.mur[2], value: agents.filter((a) => a.status === 'late').length, tone: 'warn' },
          { label: m.mur[3], value: '62 %', progress: 0.62 },
        ]}
        announcements={[m.annonce]}
        weather={{ temperature: 19, sky: 'clouds', day: true, place: 'Bordeaux' }}
        onRun={(agent) => {
          changer(agent.id, 'working')
          setTimeout(() => changer(agent.id, 'ok', m.aLaMain), 5_000)
        }}
      />
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 text-sm text-muted-foreground">{m.essayer}</span>
        {essais.map((e) => (
          <Button key={e.label} size="sm" variant={e.variant ?? 'default'} onClick={e.faire}>
            {e.label}
          </Button>
        ))}
      </div>
    </div>
  )
}

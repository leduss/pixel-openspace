'use client'

import { useEffect, useState } from 'react'
import { PixelOpenspaceDashboard } from '@/registry/pixel-openspace/dashboard'
import { MOTS, equipe, sourcesDemo } from '@/data/demo'
import type { Agent, AgentStatus, Language } from '@/registry/pixel-openspace/types'

/*
 * La démo du tableau de bord : l'équipe de la page d'accueil, répartie entre
 * ce Mac (launchd) et un dépôt GitHub, qui vit toute seule.
 */

export function Tableau({ langue }: { langue: Language }) {
  const m = MOTS[langue]
  const [agents, setAgents] = useState(() => equipe(langue))

  const changer = (id: string, status: AgentStatus, lastMessage?: string) =>
    setAgents((liste) =>
      liste.map((a) => {
        if (a.id !== id) return a
        if (!lastMessage) return { ...a, status }
        const at = new Date().toISOString()
        return { ...a, status, lastMessage, lastRun: at, runs: [...(a.runs ?? []), { at, ok: status !== 'failed', message: lastMessage }] }
      }),
    )

  /* Comme la démo de la page d'accueil : toutes les 12 secondes, un agent se met au travail, puis finit. */
  useEffect(() => {
    const libres = equipe(langue).filter((a) => a.status === 'ok')
    const t = setInterval(() => {
      const a = libres[Math.floor(Math.random() * libres.length)]
      changer(a.id, 'working')
      setTimeout(() => changer(a.id, 'ok', m.messages[Math.floor(Math.random() * m.messages.length)]), 6_000)
    }, 12_000)
    return () => clearInterval(t)
  }, [langue, m.messages])

  const relancer = (a: Agent) => {
    changer(a.id, 'working')
    setTimeout(() => changer(a.id, 'ok', m.aLaMain), 5_000)
  }

  return (
    <div className="min-h-dvh bg-[#080b16]">
      <main className="mx-auto flex w-full max-w-[1440px] flex-col gap-2 px-2 py-4 sm:px-4">
        <h1 className="m-0 px-4 pt-2 font-[family-name:var(--font-fredoka)] text-[30px] font-bold tracking-tight text-[#f3f4fa] sm:px-6">
          pixel<span className="text-[#e8b923]">-</span>openspace
        </h1>
        <PixelOpenspaceDashboard
          agents={agents}
          sources={sourcesDemo(langue)}
          language={langue}
          title="ACME OPS"
          timeline={false}
          weather={{ temperature: 14, sky: 'clouds', day: true, place: 'Lanton' }}
          onRun={relancer}
        />
      </main>
    </div>
  )
}

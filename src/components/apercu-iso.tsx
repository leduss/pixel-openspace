'use client'

import { useState } from 'react'
import { PixelOpenspace } from '@/registry/pixel-openspace/pixel-openspace'
import { equipe, sourcesDemo } from '@/data/demo'
import type { Language } from '@/registry/pixel-openspace/types'

/** La salle iso de la landing : l'équipe de démo, une zone par source, sans barre d'outils. */
export function ApercuIso({ langue }: { langue: Language }) {
  const [agents] = useState(() => equipe(langue))
  return (
    <div className="overflow-hidden rounded-xl border bg-[#0b0f20]">
      <PixelOpenspace
        agents={agents}
        language={langue}
        title="ACME OPS"
        theme="modern"
        view="iso"
        toolbar={false}
        timeline={false}
        zones={sourcesDemo(langue).map((s) => ({ name: s.name, agents: s.agents, detail: s.detail, color: s.color }))}
        weather={{ temperature: 14, sky: 'clouds', day: true, place: 'Lanton' }}
      />
    </div>
  )
}

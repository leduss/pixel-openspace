/*
 * La page du serveur : l'open space en grand, nourri par /api/state toutes
 * les cinq secondes. `?theme=gym` dans l'adresse change de thème.
 */

import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { PixelOpenspace } from '../../registry/pixel-openspace/pixel-openspace'
import type { Agent, Language, ThemeName, WallTile } from '../../registry/pixel-openspace/types'

type Etat = { title: string; language: Language; theme: ThemeName; allowRun: boolean; agents: Array<Agent>; wall: Array<WallTile> }

const THEMES: Array<ThemeName> = ['geek', 'eighties', 'gym', 'modern']

function App() {
  const [etat, setEtat] = useState<Etat | null>(null)
  const [hors, setHors] = useState(false)

  useEffect(() => {
    let fini = false
    const lire = async () => {
      try {
        const reponse = await fetch('/api/state', { cache: 'no-store' })
        if (!fini) {
          setEtat(await reponse.json())
          setHors(false)
        }
      } catch {
        if (!fini) setHors(true)
      }
    }
    void lire()
    const minuterie = setInterval(lire, 5000)
    return () => {
      fini = true
      clearInterval(minuterie)
    }
  }, [])

  if (!etat) return <p className="p-8 font-heading text-muted-foreground">pixel-openspace…</p>

  const demande = new URLSearchParams(location.search).get('theme') as ThemeName | null
  const theme = demande && THEMES.includes(demande) ? demande : etat.theme
  const relancer = async (agent: Agent) => {
    const reponse = await fetch(`/api/run/${encodeURIComponent(agent.id)}`, { method: 'POST', headers: { 'x-pixel-openspace': '1' } })
    if (!reponse.ok) throw new Error(await reponse.text())
  }

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-7xl flex-col gap-3 p-4">
      {hors ? (
        <p className="text-sm text-destructive">
          {etat.language === 'fr' ? 'Le serveur ne répond plus : la salle est figée.' : 'The server stopped answering: the room is frozen.'}
        </p>
      ) : null}
      <PixelOpenspace
        agents={etat.agents}
        title={etat.title}
        wall={etat.wall}
        language={etat.language}
        theme={theme}
        onRun={etat.allowRun ? relancer : undefined}
      />
    </main>
  )
}

createRoot(document.getElementById('racine')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

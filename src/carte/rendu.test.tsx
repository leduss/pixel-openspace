import { describe, expect, it } from 'vitest'
import { rendreCarte, rendreMessage } from './rendu'

describe('la carte de README', () => {
  const agents = [
    { id: 'ci', name: 'CI', emoji: '🧪', status: 'working' as const },
    { id: 'deploy', name: 'Deploy', emoji: '🚀', status: 'failed' as const, lastMessage: 'boom' },
    { id: 'docs', name: 'Docs', emoji: '📚', status: 'off' as const },
  ]

  it('dessine la salle en SVG autonome, ses animations en <animate>', () => {
    const svg = rendreCarte({ agents, titre: 'ACME', theme: 'neon', maintenant: new Date(2026, 9, 17, 12).getTime() })
    expect(svg).toMatch(/^<\?xml[^>]+\?>\n<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/)
    expect(svg).toContain('<title>ACME</title>')
    expect(svg).toContain('<animate ')
    // Plus aucune trace de la boucle JavaScript de la page.
    expect(svg).not.toContain('<desc')
    expect(svg).toContain('Deploy')
  })

  it('suit le thème, et dit le problème quand la salle ne peut pas se dessiner', () => {
    const ferme = rendreCarte({ agents, titre: 'ACME', theme: 'farm', maintenant: new Date(2026, 9, 17, 12).getTime() })
    expect(ferme).toContain('#14231a')
    expect(rendreMessage('acme/app not found')).toContain('acme/app not found')
  })
})

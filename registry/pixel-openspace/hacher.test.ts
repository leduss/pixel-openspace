import { describe, expect, it } from 'vitest'
import { hacher } from './primitives'
import { THEMES } from './contexte'

describe('hacher', () => {
  it('rend un entier positif stable', () => {
    expect(hacher('backup', 7, 31)).toBe(hacher('backup', 7, 31))
    expect(hacher('backup', 7, 31)).toBeGreaterThanOrEqual(0)
  })
})

describe('les tenues', () => {
  // Des identifiants dont le nombre dépasse 2³¹ : un décalage signé (>>) donnait un index négatif, donc une couleur absente, peinte en noir.
  const ids = Array.from({ length: 200 }, (_, i) => `agent-${i}`)
  for (const [nom, theme] of Object.entries(THEMES)) {
    it(`${nom} : chaque partie de chaque tenue a une couleur`, () => {
      for (const id of ids) {
        for (const [partie, couleur] of Object.entries(theme.tenue(id))) {
          expect(couleur, `${id} ${partie}`).toMatch(/^(#|color-mix)/)
        }
      }
    })
  }
})

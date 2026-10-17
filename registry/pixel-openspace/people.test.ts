import { describe, expect, it } from 'vitest'
import { TETE, TETE_SIESTE, grilleSprite } from './people'

describe('grilleSprite', () => {
  it('fait la sieste retourné, le chapeau sur les yeux, à son poste seulement', () => {
    const sieste = grilleSprite('haut', 0, 'bureau', false, false, true)
    expect(sieste.slice(0, 5)).toEqual(TETE_SIESTE)
    // Les yeux (`e`) disparaissent sous le chapeau.
    expect(sieste.join('')).not.toContain('e')
  })

  it('garde le dos tourné sans sieste, et la sieste ne vaut pas debout', () => {
    expect(grilleSprite('haut', 0, 'bureau', false, false).slice(0, 5)).toEqual(TETE.haut)
    expect(grilleSprite('bas', 0, null, false, false, true).slice(0, 5)).toEqual(TETE.bas)
  })
})
